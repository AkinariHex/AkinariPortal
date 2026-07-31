const mm = (value) => `${Number(Number(value).toFixed(2))}mm`;

export default function PlaystyleSection({ tabletInfo, tabletSettings }) {
  const area = tabletSettings.Profiles[0].AbsoluteModeSettings.Tablet;

  const surfaceWidth = tabletInfo.width;
  const surfaceHeight = tabletInfo.height;
  const rotation = area.Rotation ?? 0;

  // OpenTabletDriver stores X/Y as the center of the area in mm from the
  // top-left of the surface, so every edge is a plain percentage of it. The
  // drawing carries no text: at 180deg (players who use the tablet flipped)
  // any label inside would render upside down.
  const box = {
    left: ((area.X - area.Width / 2) / surfaceWidth) * 100,
    top: ((area.Y - area.Height / 2) / surfaceHeight) * 100,
    width: (area.Width / surfaceWidth) * 100,
    height: (area.Height / surfaceHeight) * 100,
  };

  const rows = [
    { label: "Area", value: `${mm(area.Width)} x ${mm(area.Height)}` },
    { label: "Center X", value: mm(area.X) },
    { label: "Center Y", value: mm(area.Y) },
    { label: "Rotation", value: `${rotation}°` },
    { label: "Surface", value: `${mm(surfaceWidth)} x ${mm(surfaceHeight)}` },
    {
      label: "Coverage",
      value: `${(
        ((area.Width * area.Height) / (surfaceWidth * surfaceHeight)) *
        100
      ).toFixed(1)}%`,
    },
  ];

  return (
    <div className="@container flex w-full flex-col gap-3 py-3">
      <div className="flex w-full select-none justify-center text-[10pt] font-normal text-accent-blue">
        {tabletInfo.name}
      </div>

      <div className="flex flex-col gap-4 @[30rem]:flex-row @[30rem]:items-center">
        <div className="min-w-0 flex-1">
          <div
            className="relative w-full rounded-[3px] border border-accent-blue/70"
            style={{ aspectRatio: `${surfaceWidth}/${surfaceHeight}` }}
          >
            {/* the driver's origin corner, so a rotated area still reads
                against something fixed */}
            <span className="absolute top-1 left-1 size-1.5 rounded-full bg-accent-blue/50" />
            <div
              className="absolute box-border rounded-[2px] border border-accent-blue bg-accent-blue/25"
              style={{
                left: `${box.left}%`,
                top: `${box.top}%`,
                width: `${box.width}%`,
                height: `${box.height}%`,
                rotate: `${rotation}deg`,
              }}
            >
              {/* top edge of the area and its center, the only cues that show
                  the rotation without text */}
              <span className="absolute top-0 left-1/2 h-2 w-px -translate-x-1/2 bg-accent-blue" />
              <span className="absolute top-1/2 left-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-blue" />
            </div>
          </div>
        </div>

        <dl className="grid w-full shrink-0 grid-cols-2 gap-x-4 gap-y-1.5 text-[0.8rem] @[30rem]:w-[12.5rem] @[30rem]:grid-cols-1">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-row justify-between gap-3">
              <dt className="text-[#8fa2b8]">{row.label}</dt>
              <dd className="tabular-nums text-[#cee0f6]">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
