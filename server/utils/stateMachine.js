const ALLOWED_TRANSITIONS = {
  submitted: ['under_review', 'validated', 'routed', 'rejected'],
  under_review: ['validated', 'routed', 'rejected'],
  validated: ['routed', 'team_formed', 'in_progress', 'rejected'],
  routed: ['team_formed', 'in_progress', 'validated', 'rejected'],
  team_formed: ['in_progress', 'piloted'],
  in_progress: ['piloted', 'deployed'],
  piloted: ['deployed', 'in_progress'],
  deployed: [],
  rejected: ['under_review'],
};

const canTransition = (fromStatus, toStatus) => {
  if (!fromStatus || !toStatus) return false;
  if (fromStatus === toStatus) return true;
  const allowed = ALLOWED_TRANSITIONS[fromStatus] || [];
  return allowed.includes(toStatus);
};

const assertLegalTransition = (fromStatus, toStatus) => {
  if (!canTransition(fromStatus, toStatus)) {
    const allowed = ALLOWED_TRANSITIONS[fromStatus] || [];
    const err = new Error(
      `Illegal status transition from '${fromStatus}' to '${toStatus}'. Allowed: ${
        allowed.length ? allowed.join(', ') : 'None (terminal state)'
      }.`
    );
    err.statusCode = 400;
    throw err;
  }
};

module.exports = {
  ALLOWED_TRANSITIONS,
  canTransition,
  assertLegalTransition,
};
