export default function RoleTag({ isProfessional }: { isProfessional: boolean }) {
  return (
    <span className={`role-tag ${isProfessional ? 'role-mentor' : 'role-member'}`}>
      {isProfessional ? 'Mentor / Professional' : 'Member'}
    </span>
  );
}
