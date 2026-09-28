'use client';

import Link from 'next/link';
import { usePortalData } from '../../_lib/PortalDataProvider';
import Avatar from '../../_components/Avatar';

export default function MessagesIndexPage() {
  const { state, currentUserId } = usePortalData();
  const connections = state.connections.filter(c => c.memberIds.includes(currentUserId));

  return (
    <>
      <div className="portal-page-head">
        <h1>Messages</h1>
        <p>Conversations with your active and past connections.</p>
      </div>

      {connections.length === 0 ? (
        <div className="empty-state"><span>No conversations yet. They start once a connection is accepted.</span></div>
      ) : (
        <div className="msg-layout">
          <div className="thread-list">
            {connections.map(c => {
              const otherId = c.memberIds.find(id => id !== currentUserId)!;
              const other = state.members[otherId];
              if (!other) return null;
              const last = c.lastMessage;
              return (
                <Link href={`/portal/messages/${c.id}`} key={c.id} className="thread-item">
                  <Avatar name={other.name} initials={other.initials} color={other.avatarColor} imageUrl={other.avatarUrl} size="sm" />
                  <div>
                    <div className="thread-item-name">{other.name}</div>
                    <div className="thread-item-preview">{last ? last.text : 'Say hello'}</div>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="chat-panel">
            <div className="chat-empty">Select a conversation</div>
          </div>
        </div>
      )}
    </>
  );
}
