export default function RoleTag({ isProfessional, professionalRequested }: { isProfessional: boolean; professionalRequested?: boolean }) {
  if (isProfessional) {
    return <span className="role-tag role-mentor">Mentor / Professional</span>;
  }
  if (professionalRequested) {
    return <span className="role-tag role-pending">Review pending</span>;
  }
  return <span className="role-tag role-member">Member</span>;
}
