const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');

const recordAuditAndNotify = async ({
  challengeId,
  actor,
  action,
  fromStatus = '',
  toStatus = '',
  remarks = '',
  notifications = [],
}) => {
  const tasks = [];

  if (challengeId && actor) {
    tasks.push(
      ActivityLog.create({
        challengeId,
        actorId: actor.id || actor._id,
        actorName: actor.name,
        actorRole: actor.role,
        action,
        fromStatus,
        toStatus,
        remarks,
      })
    );
  }

  const actorIdStr = actor ? String(actor.id || actor._id || '') : '';
  const seen = new Set();
  const docs = [];

  for (const n of notifications) {
    if (!n || !n.recipientId) continue;
    const recStr = String(n.recipientId);
    if (!n.includeActor && recStr === actorIdStr) continue;
    const key = `${recStr}:${n.title}`;
    if (seen.has(key)) continue;
    seen.add(key);

    docs.push({
      recipientId: n.recipientId,
      title: n.title,
      message: n.message,
      relatedChallengeId: challengeId || n.relatedChallengeId || null,
    });
  }

  if (docs.length > 0) {
    tasks.push(Notification.insertMany(docs));
  }

  await Promise.all(tasks);
};

module.exports = {
  recordAuditAndNotify,
};
