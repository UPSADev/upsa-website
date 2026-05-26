import { getEvents, getWorkshops } from '@/lib/content';
import EventCalendar, { type CalEvent } from '@/components/EventCalendar';
import '@/styles/events-cal.css';

export const metadata = { title: 'Events & Calendar' };

export default function EventsPage() {
  const rawEvents = getEvents();
  const rawWorkshops = getWorkshops();

  const calEvents: CalEvent[] = [
    ...rawEvents
      .filter(e => e.status === 'upcoming')
      .map(e => ({
        slug:        `event-${e.slug}`,
        title:       e.title,
        date:        e.date,
        location:    e.location,
        category:    e.category,
        description: e.description,
        registerUrl: e.registerUrl,
        status:      e.status,
      })),
    ...rawWorkshops
      .filter(w => w.status === 'upcoming')
      .map(w => ({
        slug:        `ws-${w.slug}`,
        title:       w.title,
        date:        w.date,
        location:    w.location,
        category:    w.type,
        description: w.description,
        registerUrl: w.registerUrl,
        status:      w.status,
      })),
  ];

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
