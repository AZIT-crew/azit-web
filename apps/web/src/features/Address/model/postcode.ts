interface SelectedPostcode {
  userSelectedType: string;
  roadAddress: string;
  jibunAddress: string;
  bname: string;
  buildingName: string;
  apartment: string;
}
export function resolvePostcodeAddress(data: SelectedPostcode) {
  const isRoad = data.userSelectedType === 'R';
  const address = isRoad
    ? data.roadAddress || data.jibunAddress
    : data.jibunAddress || data.roadAddress;
  const extras: string[] = [];
  if (isRoad) {
    if (/[동로가]$/.test(data.bname)) extras.push(data.bname);
    if (data.buildingName && data.apartment === 'Y')
      extras.push(data.buildingName);
  }
  const extraAddress = extras.length ? ` (${extras.join(', ')})` : '';
  return { baseAddress: address + extraAddress, extraAddress };
}
