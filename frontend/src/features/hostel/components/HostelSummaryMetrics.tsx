import { BedDouble, Clock, DoorOpen, Users } from "lucide-react";

type MetricValue = number | string;

interface HostelSummaryMetricsProps {
  hostelCount: MetricValue;
  activeRoomCount: MetricValue;
  availableBeds: MetricValue;
  activeAllocations: MetricValue;
}

export function HostelSummaryMetrics({
  hostelCount,
  activeRoomCount,
  availableBeds,
  activeAllocations,
}: HostelSummaryMetricsProps) {
  return (
    <section className="hostel-metrics" aria-label="Hostel summary">
      <div className="hostel-metric">
        <span className="hostel-metric-icon hostel-metric-icon--blue" aria-hidden="true">
          <BedDouble size={18} />
        </span>
        <div>
          <small>Hostels on this page</small>
          <strong>{hostelCount}</strong>
        </div>
      </div>
      <div className="hostel-metric">
        <span className="hostel-metric-icon hostel-metric-icon--green" aria-hidden="true">
          <DoorOpen size={18} />
        </span>
        <div>
          <small>Active rooms</small>
          <strong>{activeRoomCount}</strong>
        </div>
      </div>
      <div className="hostel-metric">
        <span className="hostel-metric-icon hostel-metric-icon--amber" aria-hidden="true">
          <Users size={18} />
        </span>
        <div>
          <small>Available beds on page</small>
          <strong>{availableBeds}</strong>
        </div>
      </div>
      <div className="hostel-metric">
        <span className="hostel-metric-icon hostel-metric-icon--violet" aria-hidden="true">
          <Clock size={18} />
        </span>
        <div>
          <small>Active allocations on page</small>
          <strong>{activeAllocations}</strong>
        </div>
      </div>
    </section>
  );
}
