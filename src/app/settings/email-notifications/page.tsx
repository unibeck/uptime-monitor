import { EmailChannelsDataTable } from "@/components/email-channels-data-table/email-channels-data-table";

export default function EmailNotificationsPage() {
  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Email Notification Channels
          </h2>
          <p className="text-muted-foreground">
            Manage your email notification channels here.
          </p>
        </div>
      </div>
      <div className="mt-8">
        <EmailChannelsDataTable />
      </div>
    </>
  );
}
