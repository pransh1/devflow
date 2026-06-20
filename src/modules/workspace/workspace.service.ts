import { eq, and } from 'drizzle-orm';
import { db } from '../../db';
import { workspaces, workspaceMembers, users } from '../../db/schema';
import { AppError } from '../../utils/AppError';
import type { CreateWorkspaceInput, InviteMemberInput } from './workspace.schema';

// creating workspace 
export async function createWorkspace(input: CreateWorkspaceInput, ownerId: string) {
  // check if slug is unique or not
  const existing = await db.query.workspaces.findFirst({
    where: eq(workspaces.slug, input.slug),
  });

  if(existing) {
    throw new AppError('Slug already taken', 409);
  }

  // Create workspace + add creator as owner in one transaction
  const result = await db.transaction(async (tx) => {
    const [workspace] = await tx
                              .insert(workspaces)
                              .values({...input, ownerId})
                              .returning();
    
    await tx.insert(workspaceMembers).values({
      workspaceId: workspace.id,
      userId: ownerId,
      role: 'owner',
    });

    return workspace;
  });

  return result;

};


// Get all workspaces this user is a member of
export async function getMyWorkspaces(userId: string) {
  const memberships = await db.query.workspaceMembers.findMany({
    where: eq(workspaceMembers.userId, userId),
    with: {
      workspace: true, // join workspace data
    },
  });

  // Filter out any memberships where workspace somehow doesn't exist
  return memberships
    .filter((m) => m.workspace !== null)
    .map((m) => ({
      ...m.workspace!,  
      role: m.role,
      joinedAt: m.joinedAt,
    }));
};


export async function getWorkspaceBySlug(slug: string, userId: string) {
  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.slug, slug),
  });

  if (!workspace) throw new AppError('Workspace not found', 404);

  // check user is a member or not
  const membership = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.workspaceId, workspace.id),
      eq(workspaceMembers.userId, userId),
    ),
  });

  if (!membership) throw new AppError('You are not a member of this workspace', 403);

  return { ...workspace, role: membership.role };

};

export async function inviteMember(
  workspaceId: string,
  input: InviteMemberInput,
  requesterId: string
) {
  // Only owners and admins can invite
  const requesterMembership = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.workspaceId, workspaceId),
      eq(workspaceMembers.userId, requesterId)
    ),
  });

  if(!requesterMembership || requesterMembership.role === 'member') {
    throw new AppError('Only owners and admins can invite members', 403);
  }

  // Find the user to invite
  const userToInvite = await db.query.users.findFirst({
    where: eq(users.email, input.email),
  });

  if (!userToInvite) throw new AppError('No user found with that email', 404);

  // Check not already a member
  const alreadyMember = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.workspaceId, workspaceId),
      eq(workspaceMembers.userId, userToInvite.id)
    ),
  });

  if(alreadyMember) throw new AppError('User is already a member', 409);

  const [member] = await db.insert(workspaceMembers)
                    .values({
                      workspaceId,
                      userId: userToInvite.id,
                      role: input.role,
                    }).returning()

  return member;

};

export async function getWorkspaceMembers(workspaceId: string, requesterId: string) {
  // Verify requester is a member
  const membership = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.workspaceId, workspaceId),
      eq(workspaceMembers.userId, requesterId)
    ),
  })

  if (!membership) throw new AppError('You are not a member of this workspace', 403);

  const members = await db.query.workspaceMembers.findMany({
    where: eq(workspaceMembers.workspaceId, workspaceId),
    with: {
      user: {
        columns: {
          id: true,
          email: true,
          username: true,
          fullName: true,
          avatarUrl: true
        },
      },
    },
  });

  return members;

};


export async function removeMember(
  workspaceId: string,
  targetUserId: string,
  requesterId: string 
) {
  // Can't remove yourself if you're the owner
  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.id, workspaceId)
  });
  if (!workspace) throw new AppError('Workspace not found', 404);
  if (workspace.ownerId === targetUserId) throw new AppError('Cannot remove the workspace owner', 403);
  
  // Requester must be owner or admin
  const requesterMembership = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.workspaceId, workspaceId),
      eq(workspaceMembers.userId, requesterId)
    ),
  });

  if(!requesterMembership || requesterMembership.role === 'member') {
    throw new AppError('Only owners and admins can remove members', 403);
  };

  // remove member
  await db
        .delete(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, workspaceId),
            eq(workspaceMembers.userId, targetUserId)
          )
        );

  return { message: 'Member removed' };
};

