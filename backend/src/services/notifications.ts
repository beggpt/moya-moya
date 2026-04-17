import { prisma } from '../utils/prisma';

type CreateNotifArgs = {
  userId: string;
  type:
    | 'FRIEND_REQUEST' | 'FRIEND_ACCEPTED' | 'TOPIC_REPLY' | 'POST_COMMENT'
    | 'POST_LIKE' | 'MED_REMINDER' | 'APPOINTMENT_REMINDER' | 'SYSTEM'
    | 'EDUCATIONAL' | 'SOS_ALERT' | 'CAREGIVER_ALERT' | 'WEEKLY_SUMMARY'
    | 'NEW_MESSAGE' | 'HYDRATION_REMINDER';
  title: string;
  body: string;
  data?: Record<string, any>;
};

export async function createNotification(args: CreateNotifArgs) {
  try {
    return await prisma.notification.create({
      data: {
        userId: args.userId,
        type: args.type,
        title: args.title,
        body: args.body,
        data: args.data ? JSON.stringify(args.data) : null,
      },
    });
  } catch (err) {
    console.error('createNotification error:', err);
    return null;
  }
}

export async function notifyTopicSubscribers(
  topicId: string,
  excludeUserId: string,
  commenterName: string,
  topicTitle: string,
) {
  try {
    const subs = await prisma.topicSubscription.findMany({
      where: { topicId, userId: { not: excludeUserId } },
      select: { userId: true },
    });

    await Promise.all(
      subs.map((s) =>
        createNotification({
          userId: s.userId,
          type: 'TOPIC_REPLY',
          title: 'New reply in subscribed topic',
          body: `${commenterName} replied to "${topicTitle}"`,
          data: { topicId },
        }),
      ),
    );
  } catch (err) {
    console.error('notifyTopicSubscribers error:', err);
  }
}
