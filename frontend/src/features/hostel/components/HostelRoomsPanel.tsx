import { AlertCircle, ArrowLeft, ArrowRight, DoorOpen, LoaderCircle, Pencil, X } from "lucide-react";
import type { HostelPage, HostelRoom } from "../api/hostel-types";

interface HostelRoomsPanelProps {
  rooms: HostelRoom[];
  page: HostelPage<HostelRoom> | null;
  pageIndex: number;
  loading: boolean;
  error: string;
  onRetry: () => void;
  canRead: boolean;
  canUpdate: boolean;
  saving: boolean;
  onEdit: (room: HostelRoom) => void;
  onDeactivate: (room: HostelRoom) => void;
  onPrevious: () => void;
  onNext: () => void;
}

function display(value: string): string {
  return value.split("_").map((part) => part.charAt(0) + part.slice(1).toLowerCase()).join(" ");
}

function RoomStatus({ active }: { active: boolean }) {
  return <span className={`hostel-active-pill ${active ? "hostel-active-pill--yes" : "hostel-active-pill--no"}`}>{active ? "Active" : "Inactive"}</span>;
}

export function HostelRoomsPanel({
  rooms,
  page,
  pageIndex,
  loading,
  error,
  onRetry,
  canRead,
  canUpdate,
  saving,
  onEdit,
  onDeactivate,
  onPrevious,
  onNext,
}: HostelRoomsPanelProps) {
  const state = loading
    ? { icon: <LoaderCircle className="hostel-spin" size={22} />, title: "Loading rooms…" }
    : !canRead
      ? { icon: <AlertCircle size={22} />, title: "Room read permission required" }
      : error
        ? { icon: <AlertCircle size={22} />, title: "Couldn't load rooms", description: error }
        : { icon: <DoorOpen size={24} />, title: "No rooms yet", description: "Add rooms to this hostel to start allocating students." };

  return (
    <>
      {loading || !canRead || error || rooms.length === 0 ? (
        <div className={`hostel-state hostel-rooms-state${error && !loading ? " hostel-state--error" : ""}`} role={loading ? "status" : error ? "alert" : undefined} aria-live="polite">
          {state.icon}<strong>{state.title}</strong>{"description" in state && state.description && <span>{state.description}</span>}
          {error && !loading && canRead && <button type="button" className="hostel-button hostel-button--quiet" onClick={onRetry}>Retry loading rooms</button>}
        </div>
      ) : (
        <>
          <div className="hostel-table-wrap hostel-rooms-desktop">
            <table className="hostel-table hostel-rooms-table">
              <caption className="hostel-visually-hidden">Rooms in the selected hostel</caption>
              <thead><tr><th scope="col">Room</th><th scope="col">Room type</th><th scope="col">Floor</th><th scope="col">Occupied / total beds</th><th scope="col">Available beds</th><th scope="col">Status</th><th scope="col">Actions</th></tr></thead>
              <tbody>{rooms.map((room) => (
                <tr key={room.id}>
                  <td><strong>{room.roomNumber}</strong></td>
                  <td>{display(room.roomType)}</td>
                  <td>{room.floor ?? "—"}</td>
                  <td>{room.occupied} / {room.capacity}</td>
                  <td><span className={`hostel-availability ${room.available > 0 && room.active ? "hostel-availability--yes" : "hostel-availability--no"}`}>{room.active ? room.available : 0}</span></td>
                  <td><RoomStatus active={room.active} /></td>
                  <td><div className="hostel-row-actions">
                    {canUpdate && room.active && <button type="button" className="hostel-icon-button" title={`Edit room ${room.roomNumber}`} aria-label={`Edit room ${room.roomNumber}`} onClick={() => onEdit(room)}><Pencil size={15} /></button>}
                    {canUpdate && room.active && <button type="button" className="hostel-icon-button hostel-icon-button--danger" title={`Deactivate room ${room.roomNumber}`} aria-label={`Deactivate room ${room.roomNumber}`} disabled={saving} onClick={() => onDeactivate(room)}><X size={15} /></button>}
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div className="hostel-mobile-records" aria-label="Rooms">
            {rooms.map((room) => (
              <article className="hostel-mobile-record" key={room.id}>
                <div className="hostel-mobile-record-heading"><div><span className="hostel-mobile-record-label">Room</span><h3>{room.roomNumber}</h3></div><RoomStatus active={room.active} /></div>
                <dl className="hostel-mobile-record-details">
                  <div><dt>Room type</dt><dd>{display(room.roomType)}</dd></div>
                  <div><dt>Floor</dt><dd>{room.floor ?? "—"}</dd></div>
                  <div><dt>Occupied / total</dt><dd>{room.occupied} / {room.capacity}</dd></div>
                  <div><dt>Available beds</dt><dd>{room.active ? room.available : 0}</dd></div>
                </dl>
                {canUpdate && room.active && <div className="hostel-mobile-record-actions">
                  <button type="button" className="hostel-button hostel-button--quiet" onClick={() => onEdit(room)}><Pencil size={15} /> Edit</button>
                  <button type="button" className="hostel-button hostel-button--quiet" disabled={saving} onClick={() => onDeactivate(room)}><X size={15} /> Deactivate</button>
                </div>}
              </article>
            ))}
          </div>
        </>
      )}
      <div className="hostel-pagination">
        <span>{page ? `${page.totalElements} rooms · Page ${page.number + 1} of ${Math.max(page.totalPages, 1)}` : "No results"}</span>
        <div>
          <button type="button" className="hostel-button hostel-button--quiet" disabled={loading || pageIndex === 0} onClick={onPrevious}><ArrowLeft size={15} /> Previous</button>
          <button type="button" className="hostel-button hostel-button--quiet" disabled={loading || !page || page.last} onClick={onNext}>Next <ArrowRight size={15} /></button>
        </div>
      </div>
    </>
  );
}
