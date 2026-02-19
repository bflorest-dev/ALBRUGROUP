import React from 'react';
import type { DeveloperDashboardData } from '../types';
import { getDeveloperDashboardData } from '../services';

const DeveloperDashboard: React.FC = () => {
  const [data, setData] = React.useState<DeveloperDashboardData | null>(null);

  React.useEffect(() => {
    getDeveloperDashboardData().then(setData);
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Developer Dashboard</h1>
      <h2>Repositories</h2>
      <ul>
        {data.repositories.map(repo => (
          <li key={repo.id}>{repo.name} - {repo.language}</li>
        ))}
      </ul>
      <h2>Pull Requests</h2>
      <ul>
        {data.pullRequests.map(pr => (
          <li key={pr.id}>{pr.title} - {pr.status}</li>
        ))}
      </ul>
    </div>
  );
};

export default DeveloperDashboard;