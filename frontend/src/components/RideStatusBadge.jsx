export default function RideStatusBadge({ status }) {
  let colorClass = "badge-requested";
  if (status === "MATCHED") colorClass = "badge-matched";
  if (status === "DRIVER_ARRIVED" || status === "STARTED") colorClass = "badge-started";
  if (status === "COMPLETED") colorClass = "badge-completed";
  if (status === "CANCELLED") colorClass = "badge-cancelled";

  return (
    <span className={`badge ${colorClass}`}>
      {String(status || "—").replaceAll("_", " ")}
    </span>
  );
}
