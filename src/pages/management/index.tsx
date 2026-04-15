import { useState } from "react";
import { Layout, PageHeader, Card } from "../../components";
import LocationsPage from "../admin/locations";
import FacilitiesPage from "../admin/facilities";
import TimeslotsPage from "../admin/timeslots";
import AvailabilityPage from "../admin/slot-availability";
import ApprovalsPage from "../admin/approvals";

const TABS = [
  // { label: "Overview", value: "overview" },
  { label: "Locations", value: "locations" },
  { label: "Facilities", value: "facilities" },
  { label: "Time Slots", value: "timeslots" },
  { label: "Availability", value: "availability" },
  { label: "Approvals", value: "approvals" },

];

export default function ManagementPage() {
  const [activeTab, setActiveTab] = useState("locations");

  return (
    <Layout>
      <PageHeader
        title="Management Console"
        subtitle="Configure your club locations, facilities, and slot schedules."
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {["Locations", "Facilities", "Time Slots", "Availability"].map((item) => (
            <Card key={item}>
              <p className="text-sm text-rotary-darkgray">{item}</p>
              <p className="text-2xl font-bold text-rotary-royal mt-1">—</p>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "locations" && <LocationsPage embedded />}
      {activeTab === "facilities" && <FacilitiesPage embedded />}
      {activeTab === "timeslots" && <TimeslotsPage embedded />}
      {activeTab === "availability" && <AvailabilityPage embedded />}
      {activeTab === "approvals" && <ApprovalsPage embedded />}
    </Layout>
  );
}