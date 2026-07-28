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
    <div className="flex w-full flex-col items-center justify-center">
      <div className="flex h-[15em] w-full flex-col items-center justify-center pt-[1.6em] max-[450px]:h-[11em]">
        <div
          className="relative w-max border border-accent-blue"
          style={{ aspectRatio: aspectRatio, height: `100%` }}
        >
          <div className="absolute -top-[22px] flex w-full select-none justify-center text-[10pt] font-normal text-accent-blue">
            {tabletInfo.name}
          </div>
          <div
            className="absolute box-border select-none border border-dashed border-accent-blue bg-accent-blue/20 text-[0.7rem] text-accent-blue"
            style={{
              width: `calc( 100% - (${widthDifference}px * 2.2))`,
              height: `calc( 100% - (${heightDifference}px * 2.2))`,
              top: `${Math.abs(areaTop)}px`,
              left: `${Math.abs(areaLeft)}px`,
              rotate: `${tabletRotation}deg`,
              aspectRatio: aspectRatioUsed,
            }}
          >
            <div className="absolute left-[2px] flex h-full items-center">
              {tabletUsedHeight}mm
            </div>
            <div className="absolute top-[2px] flex w-full justify-center">
              {tabletUsedWidth}mm
            </div>
            <div className="absolute bottom-[1px] flex w-full flex-row justify-center gap-2.5">
              <div>X: {tabletX}mm</div>
              <div>Y: {tabletY}mm</div>
              <div>{tabletRotation}&deg;</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
