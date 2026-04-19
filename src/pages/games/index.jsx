import { getSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { osuApiFetch } from '../../lib/osu';

export default function GamesList({ rooms, error, session }) {
  if (!session) {
    return (
      <div className="profileDivBackground">
        <div
          className="mainDiv"
          style={{ padding: '40px', color: 'white', textAlign: 'center' }}
        >
          <h1>Login Required</h1>
          <p>Please log in with your osu! account to see your match history.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profileDivBackground">
        <div className="mainDiv" style={{ padding: '20px', color: 'white' }}>
          <h1>Error loading games</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Group rooms by type
  const groupedRooms = rooms.reduce((acc, room) => {
    const type = room.type || 'unknown';
    if (!acc[type]) acc[type] = [];
    acc[type].push(room);
    return acc;
  }, {});

  return (
    <>
      <Head>
        <title>My Ranked Matches - Akinari Portal</title>
      </Head>
      <div className="profileDivBackground">
        <div className="mainDiv">
          <div className="section">
            <div className="header">
              <div className="title">My osu! lazer Ranked Matches</div>
            </div>

            <div
              style={{
                display: 'flex',
                flexFlow: 'column',
                gap: '20px',
                marginTop: '20px',
              }}
            >
              {rooms.length === 0 && (
                <p
                  style={{
                    color: '#cee0f6',
                    textAlign: 'center',
                    padding: '20px',
                  }}
                >
                  You haven't participated in any ranked matches yet.
                </p>
              )}

              {Object.entries(groupedRooms).map(([type, roomsOfType]) => (
                <div key={type} className="roomTypeSection">
                  <h2
                    style={{
                      color: '#6ba2ed',
                      fontSize: '1.2em',
                      marginBottom: '10px',
                      textTransform: 'capitalize',
                    }}
                  >
                    {type.replace('_', ' ')}
                  </h2>
                  <div
                    className="list"
                    style={{ display: 'flex', flexFlow: 'column', gap: '10px' }}
                  >
                    {roomsOfType.map((room) => (
                      <Link key={room.id} href={`/games/${room.id}`}>
                        <div
                          className="gameItem"
                          style={{
                            backgroundColor: 'var(--site-primary-color)',
                            padding: '15px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'transform 0.1s ease',
                          }}
                        >
                          <div>
                            <div
                              style={{
                                color: '#cee0f6',
                                fontSize: '1.1em',
                                fontWeight: '500',
                              }}
                            >
                              {room.name}
                            </div>
                            <div
                              style={{ color: '#636c76', fontSize: '0.9em' }}
                            >
                              Status:{' '}
                              <span
                                style={{
                                  color:
                                    room.status === 'ended'
                                      ? '#f47373'
                                      : '#6ba2ed',
                                }}
                              >
                                {room.status}
                              </span>{' '}
                              | Ended:{' '}
                              {room.ends_at
                                ? new Date(room.ends_at).toLocaleString()
                                : 'N/A'}
                            </div>
                          </div>
                          <div style={{ color: '#6ba2ed', fontWeight: 'bold' }}>
                            #{room.id}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .gameItem:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }
      `}</style>
    </>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (!session) {
    return {
      props: {
        rooms: [],
        session: null,
      },
    };
  }

  try {
    // Fetch rooms participated by the user
    // type=ranked_play filters for matchmaking rooms
    const data = await osuApiFetch(`/rooms?type=ranked_play`);

    // Filter for ended rooms as requested
    const endedRooms = (data || []).filter((room) => room.status === 'ended');

    return {
      props: {
        rooms: endedRooms,
        session: session,
      },
    };
  } catch (error) {
    console.error('Error fetching user rooms:', error);
    return {
      props: {
        rooms: [],
        session: session,
        error: error.message,
      },
    };
  }
}
