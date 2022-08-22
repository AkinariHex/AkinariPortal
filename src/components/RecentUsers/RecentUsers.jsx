import React from "react";

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
              /* onClick={() =>
                window.open(`https://akinariportal.vercel.app/users/${user.ID}`)
              } */
            >
              <div
                className="header"
                style={{ backgroundImage: `url(${user.Banner})` }}
              >
                <div className="dimForBG"></div>
                <img src={`http://s.ppy.sh/a/${user.ID}`} alt={user.ID} />
              </div>
              <div className="content">
                <div className="name">{user.Username}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RecentUsers;
