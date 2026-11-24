const t = defineVars('StarPaywall', {
  bg: '#F2F3F8', sky: '#A7DDF8', primary: '#0B87F8', chip: '#0A6FE8',
  text: '#0B0D12', soft: '#2A2F3A', muted: '#6B6B75', ink: '#FFFFFF',
  ok: '#48BE40', red: '#C70F12', blue: '#5588A6', radius: 28
}, { mode: 'Light' })
const font = 'PingFang SC'

return <Frame name="paywall" w={390} h={844} bg={t.bg} overflow="hidden" flex="col">
  <Frame name="sky" position="absolute" x={0} y={0} w={390} h={360} fill={linearGradient([['#A7DDF8', 0], ['#F2F3F8', 1]], { transform: [[0, 1, 0], [-1, 0, 1]] })} />
  <Frame name="status" w="fill" h={54} px={24} flex="row" justify="between" items="center">
    <Text font={font} size={15} weight={600} color={t.text}>13:47</Text>
    <Text font={font} size={12} weight={600} color={t.text}>▮ ⌒ ▭</Text>
  </Frame>
  <Frame name="topbar" w="fill" px={20} flex="row" justify="between">
    <Frame w={36} h={36} rounded={18} bg="#3454669E" flex="row" justify="center" items="center">
      <Vector w={11} h={11} stroke={t.ink} strokeWidth={1.9} d="M1.4 1.4 9.6 9.6M9.6 1.4 1.4 9.6" />
    </Frame>
    <Frame h={36} px={14} rounded={18} bg="#1C3848BD" flex="row" justify="center" items="center">
      <Text font={font} size={14} weight={600} color={t.ink}>Restore</Text>
    </Frame>
  </Frame>
  <Frame name="star" w="fill" h={220} flex="row" justify="center" items="center">
    <Vector w={180} h={180} stroke={t.blue} strokeWidth={14} d="M170 74 L70 75 L38 173 L120 112 Z" />
    <Vector w={180} h={180} stroke={t.red} strokeWidth={14} d="M91 13 L71 75 L9 76 L143 174 Z" />
  </Frame>
  <Frame name="body" w="fill" flex="col" px={28} gap={12}>
    <Frame h={26} px={10} rounded={8} bg={t.chip} flex="row" items="center">
      <Text font={font} size={12} weight={800} color={t.ink}>FREE UP</Text>
    </Frame>
    <Text name="headline" font={font} size={32} weight={800} color={t.text} w="fill" lineHeight="120%">Hit Continue to unlock 3 days access</Text>
    <Text name="lede" font={font} size={15} color={t.soft} w="fill">Enjoy every brain training feature for 3 days at $0.00. Plus 1000 bonus points</Text>
    <Frame name="benefits" flex="col" gap={8}>
      <Text font={font} size={16} weight={600} color={t.text}>Memory games</Text>
      <Text font={font} size={16} weight={600} color={t.text}>Focus drills</Text>
      <Text font={font} size={16} weight={600} color={t.text}>Logic puzzles and more</Text>
    </Frame>
    <Text name="refund" font={font} size={13} color={t.muted} w="fill">Cancel anytime, no hassle. Not fully happy? You can request a refund from Apple.</Text>
    <Text name="fineprint" font={font} size={11} color={t.muted} w="fill">Free for 3 days, then $19.99/week. Auto-renews unless cancelled 24h before renewal.</Text>
  </Frame>
  <Frame name="cta" position="absolute" x={24} y={700} w={342} h={56} rounded={t.radius} bg={t.primary} flex="row" justify="center" items="center">
    <Text font={font} size={18} weight={700} color={t.ink}>Continue</Text>
  </Frame>
  <Frame name="footlinks" position="absolute" x={0} y={770} w={390} flex="row" justify="center" gap={24}>
    <Text font={font} size={12} color={t.muted}>Privacy</Text>
    <Text font={font} size={12} color={t.muted}>Terms</Text>
    <Text font={font} size={12} color={t.muted}>Restore</Text>
  </Frame>
</Frame>
