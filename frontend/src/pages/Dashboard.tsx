import { useEffect, useState } from "react";
import { ping } from "../lib/api";

export default function Dashboard() {
  const [status, setStatus] = useState<string>("loading");

  useEffect(() => {
    ping()
      .then((data) => setStatus(data.status ?? "unknown"))
      .catch(() => setStatus("error"));
  }, []);

  return <div>status: {status}</div>;
}
