const t = defineVars('BlockIron', {
  bg: '#0E0F11', surface: '#1A1C20', surface2: '#22252B',
  text: '#F4F5F6', muted: '#A1A5AD', line: '#2B2E35',
  primary: '#C8FF2E', ink: '#0E0F11', accent: '#FF5A1F', radius: 6
}, { mode: 'Dark' })
const font = 'PingFang SC'

return <>
  <Frame name="home" w={390} h={844} bg={t.bg} overflow="hidden" flex="col">
    <Frame name="status" w="fill" h={54} px={24} pt={8} flex="row" justify="between" items="center">
      <Text name="time" font={font} size={14} weight={700} color={t.text}>9:41</Text>
      <Text name="status-icons" font={font} size={12} weight={700} color={t.text}>▮▮▮  ⌒  ▭</Text>
    </Frame>

    <Frame name="header" w="fill" flex="col" px={20}>
      <Frame name="brand-row" w="fill" h={48} flex="row" justify="between" items="center">
        <Frame name="brand" flex="row" gap={8} items="center">
          <Frame name="brand-mark" w={22} h={22} bg={t.primary} rounded={4} justify="center" items="center">
            <Text font={font} size={11} weight={900} color={t.ink}>BI</Text>
          </Frame>
          <Text font={font} size={12} weight={700} color={t.text}>街区铁馆</Text>
          <Text font={font} size={12} weight={500} color={t.muted}>· 望京店</Text>
        </Frame>
        <Frame name="bell" w={22} h={22}>
          <Ellipse name="bell-dot" w={7} h={7} x={14} y={1} bg={t.accent} />
        </Frame>
      </Frame>

      <Frame name="kicker" flex="row" gap={8} items="center">
        <Frame w={16} h={2} bg={t.muted} />
        <Text font={font} size={12} weight={800} color={t.muted} letterSpacing={2}>MON 11.24 · 距闭馆 6 小时</Text>
      </Frame>

      <Text name="hero" font={font} size={44} weight={900} color={t.text} lineHeight="118%" letterSpacing="-4.5%" w="fill">今晚</Text>
      <Text name="hero-2" font={font} size={44} weight={900} color={t.text} lineHeight="118%" letterSpacing="-4.5%" w="fill">上点儿强度</Text>
      <Text name="hero-sub" font={font} size={14} color={t.muted} w="fill">今晚 <Span weight={800} color={t.text}>19:30</Span> 的搏击课还差你一个，<Span weight={800} color={t.text}>剩 4 个名额</Span>。</Text>

      <Frame name="stats" w="fill" flex="row" pt={24} stroke={t.line} strokeWidth={1}>
        <Frame name="stat-week" w="fill" flex="col" py={16}>
          <Text font={font} size={30} weight={900} color={t.text} letterSpacing="-4.5%">03</Text>
          <Text font={font} size={11} color={t.muted}>本周训练</Text>
        </Frame>
        <Frame name="stat-kcal" w="fill" flex="col" py={16} pl={16}>
          <Text font={font} size={30} weight={900} color={t.text} letterSpacing="-4.5%">1,840</Text>
          <Text font={font} size={11} color={t.muted}>千卡消耗</Text>
        </Frame>
        <Frame name="stat-streak" w="fill" flex="col" py={16} pl={16}>
          <Text font={font} size={30} weight={900} color={t.text} letterSpacing="-4.5%">12</Text>
          <Text font={font} size={11} color={t.muted}>连续打卡</Text>
        </Frame>
      </Frame>
    </Frame>

    <Frame name="main" w="fill" flex="col" px={20} pt={28} gap={12}>
      <Frame name="section-head" w="fill" flex="row" justify="between" items="baseline">
        <Text font={font} size={16} weight={800} color={t.text}>今晚 19:30</Text>
        <Text font={font} size={12} weight={600} color={t.muted}>全部课表 →</Text>
      </Frame>

      <Frame name="class-card" w="fill" flex="col" bg={t.surface} rounded={t.radius} overflow="hidden">
        <Frame name="class-media" w={350} h={168} overflow="hidden">
          <Frame name="class-photo" w={350} h={168} bg={t.surface2} />
          <Frame name="class-shade" position="absolute" x={0} y={0} w={350} h={168} fill={linearGradient([['rgba(14,15,17,0.15)', 0], ['rgba(14,15,17,0.05)', 0.35], ['rgba(14,15,17,0.92)', 1]])} />
          <Text name="class-time" position="absolute" x={16} y={108} font={font} size={44} weight={900} color={t.text}>19:30</Text>
          <Frame name="class-badge" position="absolute" x={250} y={14} h={22} px={8} bg={t.accent} rounded={4} justify="center">
            <Text font={font} size={12} weight={700} color={t.bg}>仅剩 4 位</Text>
          </Frame>
        </Frame>
        <Frame name="class-body" w="fill" flex="col" p={16} gap={4}>
          <Frame w="fill" flex="row" justify="between" items="center">
            <Text font={font} size={22} weight={900} italic color={t.text}>燃脂搏击 BODYCOMBAT</Text>
            <Frame h={22} px={8} rounded={4} stroke={t.line} strokeWidth={1} justify="center">
              <Text font={font} size={12} weight={700} color={t.muted}>团操</Text>
            </Frame>
          </Frame>
          <Text font={font} size={14} color={t.muted} w="fill">陈野 · 50 分钟 · 团操房 A · 强度 4/5</Text>
          <Frame w="fill" flex="row" justify="between" items="center" pt={10}>
            <Frame flex="col" gap={6}>
              <Text font={font} size={22} weight={900} color={t.primary}>12<Span size={12} weight={400} color={t.muted}> /16 已约</Span></Text>
              <Frame name="bar" w={96} h={4} bg={t.surface2} rounded={2}>
                <Frame w={72} h="fill" bg={t.primary} />
              </Frame>
            </Frame>
            <Frame h={40} px={14} bg={t.primary} rounded={t.radius} justify="center">
              <Text font={font} size={14} weight={800} color={t.ink}>立即约课</Text>
            </Frame>
          </Frame>
        </Frame>
      </Frame>

      <Frame name="checkin" w="fill" flex="row" gap={14} items="center" p={16} bg={t.surface} rounded={t.radius}>
        <Frame w={44} h={44} rounded={t.radius} bg="#C8FF2E1A" />
        <Frame flex="col" grow={1}>
          <Text font={font} size={16} weight={800} color={t.text}>今日还没打卡</Text>
          <Text font={font} size={12} color={t.muted}>到店扫前台二维码，21:00 前有效</Text>
        </Frame>
        <Text font={font} size={16} color={t.muted}>›</Text>
      </Frame>

      <Frame name="member" w="fill" flex="row" gap={14} items="center" p={16} bg={t.surface} rounded={t.radius}>
        <Frame position="absolute" x={0} y={0} w={4} h={78} bg={t.primary} />
        <Frame flex="col" grow={1} pl={4}>
          <Text font={font} size={11} weight={700} color={t.muted} letterSpacing={1}>SILVER · 年卡会员</Text>
          <Text font={font} size={30} weight={900} color={t.text}>8</Text>
          <Text font={font} size={12} color={t.muted}>次团课额度</Text>
        </Frame>
        <Text font={font} size={11} color={t.muted}>到期 2027.03.31</Text>
        <Text font={font} size={16} color={t.muted}>›</Text>
      </Frame>

      <Frame name="store" w="fill" flex="col" gap={6} p={16} bg={t.surface} rounded={t.radius}>
        <Frame w="fill" flex="row" justify="between">
          <Text font={font} size={14} weight={800} color={t.text}>街区铁馆 · 望京店</Text>
          <Text font={font} size={11} weight={800} color={t.primary}>营业中</Text>
        </Frame>
        <Text font={font} size={12} color={t.muted} w="fill" lineHeight="170%">朝阳区望京西路 9 号院 B1 · 距你 480 米
周一至周日 06:30 – 23:00 · 前台 010-8472 6630</Text>
        <Frame w="fill" flex="row" gap={10} pt={8}>
          <Frame grow={1} h={40} rounded={t.radius} stroke={t.line} strokeWidth={1} justify="center">
            <Text font={font} size={14} weight={800} color={t.text}>导航到店</Text>
          </Frame>
          <Frame grow={1} h={40} rounded={t.radius} stroke={t.line} strokeWidth={1} justify="center">
            <Text font={font} size={14} weight={800} color={t.text}>联系前台</Text>
          </Frame>
        </Frame>
      </Frame>
    </Frame>

    <Frame name="tabbar" position="absolute" x={0} y={761} w={390} h={83} px={6} pb={34} bg={t.bg} flex="row" stroke={t.line} strokeWidth={1}>
      <Frame w="fill" h={48} flex="col" justify="center" items="center" gap={4}>
        <Text font={font} size={12} weight={800} color={t.primary}>首页</Text>
      </Frame>
      <Frame w="fill" h={48} flex="col" justify="center" items="center">
        <Text font={font} size={12} weight={600} color={t.muted}>约课</Text>
      </Frame>
      <Frame w="fill" h={48} flex="col" justify="center" items="center">
        <Text font={font} size={12} weight={600} color={t.muted}>打卡</Text>
      </Frame>
      <Frame w="fill" h={48} flex="col" justify="center" items="center">
        <Text font={font} size={12} weight={600} color={t.muted}>会员卡</Text>
      </Frame>
    </Frame>
  </Frame>

  <Switch.Root name="Notify" modelValue="State">
    <Component name="State=Off" w={44} h={24} bg={t.surface2} rounded={12}>
      <Switch.Thumb x={2} y={2} w={20} h={20} bg={t.text} rounded={10} />
    </Component>
    <Component name="State=On" w={44} h={24} bg={t.primary} rounded={12}>
      <Switch.Thumb x={22} y={2} w={20} h={20} bg={t.ink} rounded={10} />
    </Component>
  </Switch.Root>
</>
