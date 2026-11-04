// "4352345", "https://osu.ppy.sh/b/4352345" or
// "https://osu.ppy.sh/beatmapsets/123#osu/4352345" -> 4352345 (the last number).
export function beatmapIdFromInput(input: string): number | null {
  const nums = input.match(/\d+/g);
  if (!nums) return null;
  const id = Number(nums[nums.length - 1]);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
