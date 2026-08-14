import { getGoogleCalendarEvents } from '@/lib/google-calendar';
import EventCalendar from '@/components/EventCalendar';
import '@/styles/events-cal.css';

export const revalidate = 300; // regenerate every 5 minutes

export const metadata = { title: 'Events & Calendar' };

export default async function EventsPage() {
  const calEvents = await getGoogleCalendarEvents();

  return (
    <>
      <div className="page-hero">
        <div className="inner">
          <span className="ph-tag">Community / Events</span>
          <h1>Events &amp; <em>Calendar</em></h1>
          <p>
            Upcoming galas, workshops, seminars, city meetups, and UPSA community programs.
            Click any event to see details and register.
          </p>
        </div>
      </div>

      <div className="events-cal-page">
        <EventCalendar events={calEvents} />
      </div>
    </>
  );
}
