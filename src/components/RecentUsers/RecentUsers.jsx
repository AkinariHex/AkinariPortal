import React from 'react';

function RecentUsers({ rUsers }) {
  return (
    <div className="homepageContainer" id="recentUsers">
      <div className="title">Recent Users</div>
      <div className="items">
        {rUsers.map((user, index) => {
          return (
            <div
              key={index}
              className="item users"
              onClick={() => window.open(`/users/${user.id}`, '_self')}
            >
              <div
                className="header"
                style={{ backgroundImage: `url(${user.banner})` }}
              >
                <div className="dimForBG"></div>
                <img src={`http://s.ppy.sh/a/${user.id}`} alt={user.id} />
              </div>
              <div className="content">
                <div className="name">{user.username}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RecentUsers;
