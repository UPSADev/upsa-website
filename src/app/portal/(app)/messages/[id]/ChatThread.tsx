'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CURRENT_USER_ID, usePortalData } from '../../../_lib/PortalDataProvider';
import Avatar from '../../../_components/Avatar';

export default function ChatThread({ connectionId }: { connectionId: string }) {
  const { state, sendMessage } = usePortalData();
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const connection = state.connections.find(c => c.id === connectionId);
  const myConnections = state.connections.filter(c => c.memberIds.includes(CURRENT_USER_ID));
  const threadMessages = state.messages.filter(m => m.connectionId === connectionId);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [threadMessages.length, connectionId]);

  if (!connection || !connection.memberIds.includes(CURRENT_USER_ID)) {
    return <div className="empty-state"><span>Conversation not found.</span></div>;
  }

  const otherId = connection.memberIds.find(id => id !== CURRENT_USER_ID)!;
  const other = state.members[otherId];

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    sendMessage(connectionId, draft);
    setDraft('');
  }

  return (
    <>
      <div className="portal-page-head"><h1>Messages</h1></div>
      <div className="msg-layout">
        <div className="thread-list">
          {myConnections.map(c => {
            const oId = c.memberIds.find(id => id !== CURRENT_USER_ID)!;
            const o = state.members[oId];
            const msgs = state.messages.filter(m => m.connectionId === c.id);
            const last = msgs[msgs.length - 1];
            return (
              <Link href={`/portal/messages/${c.id}`} key={c.id} className={`thread-item${c.id === connectionId ? ' active' : ''}`}>
                <Avatar name={o.name} initials={o.initials} color={o.avatarColor} size="sm" />
                <div>
                  <div className="thread-item-name">{o.name}</div>
                  <div className="thread-item-preview">{last ? last.text : 'Say hello'}</div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="chat-panel">
          <div className="chat-head">
            <Avatar name={other.name} initials={other.initials} color={other.avatarColor} size="sm" />
            <div>
              <div className="chat-head-name">{other.name}</div>
              <div className="chat-head-sub">{other.role ? `${other.role} · ${other.company}` : other.headline}</div>
            </div>
          </div>
          <div className="chat-scroll" ref={scrollRef}>
            {threadMessages.length === 0 ? (
              <div className="chat-empty">Say hello to {other.name.split(' ')[0]}</div>
            ) : (
              threadMessages.map(m => (
                <div className={`chat-bubble ${m.senderId === CURRENT_USER_ID ? 'mine' : 'theirs'}`} key={m.id}>
                  {m.text}
                  <span className="time">{m.time}</span>
                </div>
              ))
            )}
          </div>
          <form className="chat-input-row" onSubmit={handleSend}>
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder={`Message ${other.name.split(' ')[0]}…`}
              aria-label="Message"
            />
            <button type="submit" className="btn-primary btn-sm">Send</button>
          </form>
        </div>
      </div>
    </>
  );
}
