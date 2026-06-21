import { eq, and } from 'drizzle-orm';
import { db } from '../../db';
import { attachments, issues } from '../../db/schema';
import { AppError } from '../../utils/AppError';
import { deleteCache, CacheKeys } from '../../utils/cache';
import { cloudinary } from '../../config/multer';

export async function saveAttachments(
  files: Express.Multer.File[],
  issueId: string,
  workspaceId: string,
  userId: string
) {
  // verify issue exists and belong to workspace
  const issue = await db.query.issues.findFirst({
    where: and(
      eq(issues.id, issueId),
      eq(issues.workspaceId, workspaceId),
    ),
  });

  if(!issue) throw new AppError('Issue not found', 404);

  const saved = await db.insert(attachments)
                        .values(
                          files.map((file) => ({
                            issueId,
                            uploadedById: userId,
                            filename: file.originalname,
                            storedName: (file as any).filename || (file as any).public_id || file.originalname,
                            mimeType: file.mimetype,
                            size: file.size,
                            url: (file as any).path, // Cloudinary returns the CDN URL in file.path
                          }))
                        ).returning();

  // Bust issue cache so next fetch includes new attachments
  await deleteCache(CacheKeys.issue(issueId));

  return saved;
};

export async function deleteAttachment(
  attachmentId: string,
  userId: string,
  workspaceId: string
) {
  const attachment = await db.query.attachments.findFirst({
    where: eq(attachments.id, attachmentId),
    with: { issue: true },
  });

  if(!attachment) throw new AppError('Attachment not found', 404);
  if(attachment.issue.workspaceId !== workspaceId) throw new AppError('Not found', 404);

  // Only uploader can delete
  if(attachment.uploadedById !== userId) {
    throw new AppError('You can only delete your own attachments', 403);
  }

  // Delete from cloudinary
  try {
    const urlParts = attachment.url.split('/');
    const publicIdWithExt = urlParts.slice(-2).join('/'); // folder/filename
    const publicId = publicIdWithExt.replace(/\.[^/.]+$/, ''); // remove extension
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete failed — continuing with DB delete');
  }

  // Delete from DB
  await db.delete(attachments).where(eq(attachments.id, attachmentId));

  // Bust cache
  await deleteCache(CacheKeys.issue(attachment.issueId));

  return { message: 'Attachment deleted' };

}

export async function getIssueAttachments(issueId: string, workspaceId: string) {
  const issue = await db.query.issues.findFirst({
    where: and(
      eq(issues.id, issueId), 
      eq(issues.workspaceId, workspaceId)
    ),
  });
  if (!issue) throw new AppError('Issue not found', 404);

  return db.query.attachments.findMany({
    where: eq(attachments.issueId, issueId),
    with: {
      uploadedBy: {
        columns: { id: true, username: true, fullName: true, avatarUrl: true },
      },
    },
    orderBy: (attachments, { desc }) => desc(attachments.createdAt),
  });
}