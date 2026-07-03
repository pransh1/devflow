import { eq, and, desc, lt, asc, isNull } from 'drizzle-orm';
import { db } from '../../db';
import {
  channels, channelMembers, channelMessages,
  workspaceMembers, users, workspaces
} from '../../db/schema';
import { AppError } from '../../utils/AppError';
import { emitToWorkspace } from '../../socket';
import type { CreateChannelInput, SendMessageInput, GetMessagesInput } from './chat.schema';


// ─── Channels ────────────────────────────────────────────────
export async function createChannel(
  input: CreateChannelInput, 
  workspaceId: string,
  userId: string
) {
  // check name is unique or not 
  const existing = await db.query.channels.findFirst({
    where: and(
      eq(channels.workspaceId, workspaceId),
      eq(channels.name, input.name)
    )
  });
  if(existing) throw new AppError('Channel name already exists in this workspace', 409);
  
  const result = await db.transaction(async (tx) => {
    const [channel] = await tx
                            .insert(channels)
                            .values({ ...input, workspaceId, createdById: userId })
                            .returning()

    // Creator auto-joins their own channel
    await tx.insert(channelMembers).values({
      channelId: channel.id,
      userId
   });

   return channel;
  });

  // Notify workspace a new channel was created
  emitToWorkspace(workspaceId, 'channel:created', { channel: result });
  
  return result;
};

export async function getChannels(workspaceId: string, userId: string) {
  // Return channels the user is a member of
  const memberships = await db.query.channelMembers.findMany({
    where: eq(channelMembers.userId, userId),
    with: {
      channel: true,
    },
  });
  return memberships
    .filter((m) => m.channel?.workspaceId === workspaceId)
    .map((m) => m.channel!);
};

export async function getChannelById(channelId: string, userId: string) {
  const channel = await db.query.channels.findFirst({
    where: eq(channels.id, channelId),
    with: {
      createdBy: {
        columns: { id: true, username: true, fullName: true, avatarUrl: true },
      },
    },
  });
  if(!channel) throw new AppError('Channel not found', 404);

  // verify user is a member 
  const membership = await db.query.channelMembers.findFirst({
    where: and(
      eq(channelMembers.channelId, channelId),
      eq(channelMembers.userId, userId),
    ),
  });
  if(!membership) throw new AppError('You are not a member of this channel', 403);

  return channel;
};

export async function joinChannel(
  channelId: string,
  workspaceId: string,
  userId: string
) {
  const channel = await db.query.channels.findFirst({
    where: and(
      eq(channels.id, channelId),
      eq(channels.workspaceId, workspaceId)
    ),
  });

  if(!channel) throw new AppError('Channel not found', 404);
  if(channel.isPrivate) throw new AppError('Cannot join a private channel directly', 403);

  const already = await db.query.channelMembers.findFirst({
    where: and(
      eq(channelMembers.channelId, channelId),
      eq(channelMembers.userId, userId),
    ),
  });

  if(already) throw new AppError('Already a member', 409);

  await db.insert(channelMembers).values({ channelId, userId });

  emitToWorkspace(workspaceId, 'channel:member_joined', { channelId, userId });

  return { message: 'Joined channel' };
};

export async function deleteChannel(
  channelId: string,
  workspaceId: string,
  userId: string
) {
  const channel =await db.query.channels.findFirst({
    where: and(
      eq(channels.id, channelId),
      eq(channels.workspaceId, workspaceId),
    ),
  });

  if(!channel) throw new AppError('Channel not found', 404);

  // Only channel creator or workspace owner can delete
  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.id, workspaceId),
  });

  if(channel.createdById !== userId && workspace?.ownerId !== userId) {
    throw new AppError('Only the channel creator or workspace owner can delete channels', 403);
  }

  await db.delete(channels).where(eq(channels.id, channelId));

  emitToWorkspace(workspaceId, 'channel:deleted', { channelId });

  return { message: 'Channel deleted' };

};


// ─── Messages ────────────────────────────────────────────────
export async function sendMessage(
  input: SendMessageInput,
  channelId: string,
  workspaceId: string,
  authorId: string
) {
  // Verify channel belongs to workspace
  const channel = await db.query.channels.findFirst({
    where: and(
      eq(channels.id, channelId),
      eq(channels.workspaceId, workspaceId),
    ),
  });
  if(!channel) throw new AppError('Channel not found', 404);

  // Verify sender is a channel member
  const membership = await db.query.channelMembers.findFirst({
    where: and(
      eq(channelMembers.channelId, channelId),
      eq(channelMembers.userId, authorId),
    ),
  });

  if(!membership) throw new AppError('You are not a member of this channel', 403);

  // If it's a thread reply, verify parent exists in same channel
  if(input.parentId) {
    const parent = await db.query.channelMessages.findFirst({
      where: and(
        eq(channelMessages.id, input.parentId),
        eq(channelMessages.channelId, channelId)
      ),
    });
    if (!parent) throw new AppError('Parent message not found', 404);
    // Prevent nested threads — replies can only be top-level
    if (parent.parentId) throw new AppError('Cannot reply to a thread reply', 400);
  }

  const [message] = await db.insert(channelMessages)
                            .values({
                              channelId,
                              authorId,
                              content: input.content,
                              parentId: input.parentId
                            })
                            .returning()

  // Fetch author info to include in the socket event
  const author = await db.query.users.findFirst({
    where: eq(users.id, authorId),
    columns: { id: true, username: true, fullName: true, avatarUrl: true },
  });

  // Emit to workspace room — all channel members see it instantly
  emitToWorkspace(workspaceId, 'message:new', {
    message: { ...message, author },
    channelId,
  });

  return { ...message, author };
};

export async function getMessages(
  channelId: string,
  workspaceId: string,
  userId: string,
  filters: GetMessagesInput
) {
  // verify access
  const channel = await db.query.channels.findFirst({
    where: and(
      eq(channels.id, channelId),
      eq(channels.workspaceId, workspaceId),
    ),
  });
  if(!channel) throw new AppError('Channel not found', 404);

  const membership = await db.query.channelMembers.findFirst({
    where: and(
      eq(channelMembers.channelId, channelId),
      eq(channelMembers.userId, userId),
    ),
  });
  if(!membership) throw new AppError('You are not a member of this channel', 403);

  const { limit, before } = filters;

  // Cursor-based pagination — fetch messages before a given message ID
  // This is better than offset pagination for chat (infinite scroll)
  let whereClause;
  if(before) {
    const cursorMessage = await db.query.channelMessages.findFirst({
      where: eq(channelMessages.id, before),
    });

    if(cursorMessage) {
      whereClause = and(
        eq(channelMessages.channelId, channelId),
        lt(channelMessages.createdAt, cursorMessage.createdAt),
        isNull(channelMessages.parentId), // top level only
      );
    } 
  } else {
    whereClause = and(
      eq(channelMessages.channelId, channelId),
      isNull(channelMessages.parentId)
    );
  };

  const message = await db.query.channelMessages.findMany({
    where: whereClause,
    with: {
      author: {
        columns: { id: true, username: true, fullName: true, avatarUrl: true },
      },
      replies: {
        with: {
          author: {
            columns: { id: true, username: true, fullName: true, avatarUrl: true },
          },
        },
        orderBy: asc(channelMessages.createdAt),
      },
    },
    orderBy: desc(channelMessages.createdAt),
    limit,
  });

  // Update last read timestamp
  await db.update(channelMembers)
          .set({ lastReadAt: new Date() })
          .where(
            and(
              eq(channelMembers.channelId, channelId),
              eq(channelMembers.userId, userId)
            )
          );

  // Return in chronological order for display
  return message.reverse();
};

export async function editMessage(
  messageId: string,
  channelId: string,
  workspaceId: string,
  userId: string,
  content: string
) {
  const message = await db.query.channelMessages.findFirst({
    where: and(
      eq(channelMessages.id, messageId),
      eq(channelMessages.channelId, channelId)
    ),
    with: { channel: true },
  });

  if (!message) throw new AppError('Message not found', 404);
  if (message.channel.workspaceId !== workspaceId) throw new AppError('Not found', 404);
  if (message.authorId !== userId) throw new AppError('You can only edit your own messages', 403);

  const [updated] = await db
    .update(channelMessages)
    .set({ content, isEdited: true, updatedAt: new Date() })
    .where(eq(channelMessages.id, messageId))
    .returning();

  emitToWorkspace(workspaceId, 'message:edited', {
    message: updated,
    channelId,
  });

  return updated;
}

export async function deleteMessage(
  messageId: string,
  channelId: string,
  workspaceId: string,
  userId: string
) {
  const message = await db.query.channelMessages.findFirst({
    where: and(
      eq(channelMessages.id, messageId),
      eq(channelMessages.channelId, channelId)
    ),
    with: { channel: true },
  });

  if (!message) throw new AppError('Message not found', 404);
  if (message.channel.workspaceId !== workspaceId) throw new AppError('Not found', 404);
  if (message.authorId !== userId) throw new AppError('You can only delete your own messages', 403);

  await db.delete(channelMessages).where(eq(channelMessages.id, messageId));

  emitToWorkspace(workspaceId, 'message:deleted', {
    messageId,
    channelId,
  });

  return { message: 'Message deleted' };
}

export async function getThreadReplies(
  messageId: string,
  channelId: string,
  workspaceId: string,
  userId: string
) {
  // verify access
  const membership = await db.query.channelMembers.findFirst({
    where: and(
      eq(channelMembers.channelId, channelId),
      eq(channelMembers.userId, userId),
    ),
  });
  if(!membership) throw new AppError('You are not a member of this channel', 403);

  const replies = await db.query.channelMessages.findMany({
    where: and(
      eq(channelMessages.parentId, messageId),
      eq(channelMessages.channelId, channelId),
    ),
    with: {
      author: {
        columns: { id: true, username: true, fullName: true, avatarUrl: true },
      },
    },
    orderBy: asc(channelMessages.createdAt),
  });

  return replies;

};
