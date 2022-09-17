export default function PlaystyleSection({ tabletInfo, tabletSettings }) {
  const tabletMaxWidth = tabletInfo.width; /* 152 */
  const tabletMaxHeight = tabletInfo.height; /* 95 */

  const tabletUsedWidth =
    tabletSettings.Profiles[0].AbsoluteModeSettings.Tablet.Width; /* 110 */
  const tabletUsedHeight =
    tabletSettings.Profiles[0].AbsoluteModeSettings.Tablet.Height; /* 70 */

  const widthDifference = tabletMaxWidth - tabletUsedWidth;
  const heightDifference = tabletMaxHeight - tabletUsedHeight;

  const tabletX =
    tabletSettings.Profiles[0].AbsoluteModeSettings.Tablet.X; /* 76 */
  const tabletY =
    tabletSettings.Profiles[0].AbsoluteModeSettings.Tablet.Y; /* 47.5 */
  const tabletRotation =
    tabletSettings.Profiles[0].AbsoluteModeSettings.Tablet.Rotation;

  const top0 = tabletUsedHeight / 2;
  const left0 = tabletUsedWidth / 2;

  const aspectRatio = `${tabletMaxWidth}/${tabletMaxHeight}`;
  const aspectRatioUsed = `${tabletUsedWidth}/${tabletUsedHeight}`;

  const areaTop = (tabletY - top0) * 2.2;
  const areaLeft = (tabletX - left0) * 2.2;

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
              width: `calc( 100% - (${widthDifference}px * 2.2))`,
              height: `calc( 100% - (${heightDifference}px * 2.2))`,
              top: `${Math.abs(areaTop)}px`,
              left: `${Math.abs(areaLeft)}px`,
              rotate: `${tabletRotation}deg`,
              aspectRatio: aspectRatioUsed,
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
      {/* <div className="info">
        <div className="item" id="firstPenButton">
          <div className="button">
            <div className="key">Z</div>
            <div className="action">Quick Restart Map</div>
          </div>
          <div className="type">Pen Button 1</div>
        </div>
        <div className="item" id="secondPenButton">
          <div className="button">
            <div className="key">Z</div>
            <div className="action">Quick Restart Map</div>
          </div>
          <div className="type">Pen Button 2</div>
        </div>
      </div> */}
    </div>
  );
}
