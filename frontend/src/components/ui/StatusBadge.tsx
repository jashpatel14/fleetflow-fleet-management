

const VEHICLE: Record<string, { label: string; cls: string }> = {
  AVAILABLE: { label: 'Available', cls: 'badge badge-green' },
  ON_TRIP: { label: 'On Trip', cls: 'badge badge-blue' },
  IN_SHOP: { label: 'In Shop', cls: 'badge badge-orange' },
  RETIRED: { label: 'Retired', cls: 'badge badge-gray' },
};
const DRIVER: Record<string, { label: string; cls: string }> = {
  ON_DUTY: { label: 'On Duty', cls: 'badge badge-green' },
  OFF_DUTY: { label: 'Off Duty', cls: 'badge badge-yellow' },
  SUSPENDED: { label: 'Suspended', cls: 'badge badge-red' },
};
const TRIP: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: 'Draft', cls: 'badge badge-gray' },
  SUBMITTED: { label: 'Submitted', cls: 'badge badge-yellow' },
  APPROVED: { label: 'Approved', cls: 'badge badge-purple' },
  DISPATCHED: { label: 'Dispatched', cls: 'badge badge-blue' },
  COMPLETED: { label: 'Completed', cls: 'badge badge-green' },
  CANCELLED: { label: 'Cancelled', cls: 'badge badge-red' },
};
const MAINTENANCE: Record<string, { label: string; cls: string }> = {
  OPEN: { label: 'Open', cls: 'badge badge-orange' },
  CLOSED: { label: 'Closed', cls: 'badge badge-green' },
};

const MAP = { vehicle: VEHICLE, driver: DRIVER, trip: TRIP, maintenance: MAINTENANCE };
type BadgeType = keyof typeof MAP;

const StatusBadge = ({ type, status }: { type: BadgeType; status: string }) => {
  const c = MAP[type]?.[status] || { label: status, cls: 'badge badge-gray' };
  return (
    <span className={c.cls}>
      <span className="badge-dot" />
      {c.label}
    </span>
  );
};

export default StatusBadge;
