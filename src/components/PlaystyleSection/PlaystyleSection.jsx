export default function PlaystyleSection({ tabletInfo, tabletSettings }) {
  console.log(tabletSettings);

  const tabletMaxWidth = tabletInfo.width; /* 152 */
  const tabletMaxHeight = tabletInfo.height; /* 95 */

  const profile = tabletSettings.Profiles[0].AbsoluteModeSettings.Tablet;

  const tabletUsedWidth = profile.Width; /* 110 */
  const tabletUsedHeight = profile.Height; /* 70 */

  const tabletX = profile.X; /* 76 */
  const tabletY = profile.Y; /* 47.5 */
  const tabletRotation = profile.Rotation || 0;

  const top = ((tabletY - tabletUsedHeight / 2) / tabletMaxHeight) * 100;
  const left = ((tabletX - tabletUsedWidth / 2) / tabletMaxWidth) * 100;

  const aspectRatio = `${tabletMaxWidth}/${tabletMaxHeight}`;
  const aspectRatioUsed = `${tabletUsedWidth}/${tabletUsedHeight}`;

  const width = (tabletUsedWidth / tabletMaxWidth) * 100;
  const height = (tabletUsedHeight / tabletMaxHeight) * 100;

  return (
    <div className="playstyleContainer">
      <div className="tabletAreaContainer">
        <div
          className="tabletArea"
          style={{
            aspectRatio: aspectRatio,
            height: `100%`,
          }}
        >
          <div className="name">{tabletInfo.name}</div>
          <div
            className="tabletUsedArea"
            style={{
              width: `${width}%`,
              height: `${height}%`,
              top: `${top}%`,
              left: `${left}%`,
              transform: `rotate(${tabletRotation}deg)`,
            }}
          >
            <div className="height">{tabletUsedHeight}mm</div>
            <div className="width">{tabletUsedWidth}mm</div>
            <div className="coordinates">
              <div className="x">X: {tabletX}mm</div>
              <div className="y">Y: {tabletY}mm</div>
              <div className="deg">{tabletRotation}°</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
