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
      <Frame name="status-icons" flex="row" gap={6} items="center">
        <Vector w={17} h={11} fill={t.text} d="M0 7h3v4H0zM4.5 5h3v6h-3zM9 2.5h3v8.5H9zM13.5 0h3v11h-3z" />
        <Vector w={16} h={11} stroke={t.text} strokeWidth={1.4} d="M1 3.6a10 10 0 0 1 14 0M3.6 6.4a6.4 6.4 0 0 1 8.8 0M6.2 9a2.8 2.8 0 0 1 3.6 0" />
        <Frame w={25} h={12}>
          <Vector w={25} h={12} stroke={t.text} strokeWidth={1} d="M3.3 0.7H19.1A2.6 2.6 0 0 1 21.7 3.3V8.7A2.6 2.6 0 0 1 19.1 11.3H3.3A2.6 2.6 0 0 1 0.7 8.7V3.3A2.6 2.6 0 0 1 3.3 0.7ZM23.4 4.2v3.6" />
          <Vector w={25} h={12} fill={t.text} d="M3.9 2.4H15.9A1.5 1.5 0 0 1 17.4 3.9V8.1A1.5 1.5 0 0 1 15.9 9.6H3.9A1.5 1.5 0 0 1 2.4 8.1V3.9A1.5 1.5 0 0 1 3.9 2.4Z" />
        </Frame>
      </Frame>
    </Frame>

    <Frame name="header" w="fill" flex="col" px={20}>
      <Frame name="brand-row" w="fill" h={48} flex="row" justify="between" items="center">
        <Frame name="brand" flex="row" gap={8} items="center">
          <Frame name="brand-mark" w={22} h={22} bg={t.primary} rounded={4} flex="row" justify="center" items="center">
            <Text font={font} size={11} weight={900} color={t.ink}>BI</Text>
          </Frame>
          <Text font={font} size={12} weight={700} color={t.text}>街区铁馆</Text>
          <Text font={font} size={12} weight={500} color={t.muted}>· 望京店</Text>
        </Frame>
        <Frame name="bell" w={22} h={22}>
          <Vector w={22} h={22} stroke={t.text} strokeWidth={1.9} d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6M10.3 20a2 2 0 0 0 3.4 0" />
          <Ellipse name="bell-dot" w={7} h={7} x={14} y={1} bg={t.accent} />
        </Frame>
      </Frame>

      <Frame name="kicker" flex="row" gap={8} items="center">
        <Frame w={16} h={2} bg={t.muted} />
        <Text font={font} size={12} weight={800} color={t.muted} letterSpacing={2}>MON 11.24 · 距闭馆 6 小时</Text>
      </Frame>

      <Frame name="hero-gap" w="fill" h={12} />
      <Text name="hero" font={font} size={44} weight={900} color={t.text} lineHeight="118%" letterSpacing="-4.5%" w="fill">今晚</Text>
      <Text name="hero-2" font={font} size={44} weight={900} color={t.text} lineHeight="118%" letterSpacing="-4.5%" w="fill">上点儿强度</Text>
      <Frame name="sub-gap" w="fill" h={16} />
      <Text name="hero-sub" font={font} size={14} color={t.muted} w="fill">今晚 <Span weight={800} color={t.text}>19:30</Span> 的搏击课还差你一个，<Span weight={800} color={t.text}>剩 4 个名额</Span>。</Text>

      <Frame name="stats-gap" w="fill" h={21} />
      <Frame name="stats" w="fill" flex="row" stroke={t.line} strokeWidth={1} strokeWeights={{ top: 1, bottom: 1 }}>
        <Frame name="stat-week" w="fill" flex="col" py={16}>
          <Text font={font} size={30} weight={900} color={t.text} letterSpacing="-4.5%">03</Text>
          <Text font={font} size={11} color={t.muted}>本周训练</Text>
        </Frame>
        <Frame name="stat-kcal" w="fill" flex="col" py={16} pl={16} stroke={t.line} strokeWidth={1} strokeWeights={{ left: 1 }}>
          <Text font={font} size={30} weight={900} color={t.text} letterSpacing="-4.5%">1,840</Text>
          <Text font={font} size={11} color={t.muted}>千卡消耗</Text>
        </Frame>
        <Frame name="stat-streak" w="fill" flex="col" py={16} pl={16} stroke={t.line} strokeWidth={1} strokeWeights={{ left: 1 }}>
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
          <Frame name="class-shade" position="absolute" x={0} y={0} w={350} h={168} fill={linearGradient([['rgba(14,15,17,0.15)', 0], ['rgba(14,15,17,0.05)', 0.35], ['rgba(14,15,17,0.92)', 1]], { transform: [[0, 1, 0], [-1, 0, 1]] })} />
          <Text name="class-time" position="absolute" x={16} y={100} font={font} size={44} weight={900} color={t.text}>19:30</Text>
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
          <Frame w="fill" flex="row" justify="between" items="center" pt={14}>
            <Frame flex="col" gap={6}>
              <Text font={font} size={22} weight={900} color={t.primary}>12<Span size={12} weight={400} color={t.muted}> /16 已约</Span></Text>
              <Frame name="bar" w={96} h={4} flex="row" bg={t.surface2} rounded={2}>
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
        <Frame w={44} h={44} rounded={t.radius} bg="#C8FF2E1A" flex="row" justify="center" items="center">
          <Vector w={24} h={24} stroke={t.primary} strokeWidth={1.8} d="M3.5 8.5v-3a2 2 0 0 1 2-2h3M15.5 3.5h3a2 2 0 0 1 2 2v3M20.5 15.5v3a2 2 0 0 1-2 2h-3M8.5 20.5h-3a2 2 0 0 1-2-2v-3M3.5 12h17" />
        </Frame>
        <Frame flex="col" grow={1}>
          <Text font={font} size={16} weight={800} color={t.text}>今日还没打卡</Text>
          <Text font={font} size={12} color={t.muted}>到店扫前台二维码，21:00 前有效</Text>
        </Frame>
        <Vector w={20} h={20} stroke={t.muted} strokeWidth={1.9} d="M9 5l7 7-7 7" />
      </Frame>

      <Frame name="member" w="fill" flex="row" gap={14} items="center" p={16} bg={t.surface} rounded={t.radius}>
        <Frame position="absolute" x={0} y={0} w={4} h={78} bg={t.primary} />
        <Frame flex="col" grow={1} pl={4}>
          <Text font={font} size={11} weight={700} color={t.muted} letterSpacing={1}>SILVER · 年卡会员</Text>
          <Text font={font} size={30} weight={900} color={t.text}>8</Text>
          <Text font={font} size={12} color={t.muted}>次团课额度</Text>
        </Frame>
        <Text font={font} size={11} color={t.muted}>到期 2027.03.31</Text>
        <Vector w={20} h={20} stroke={t.muted} strokeWidth={1.9} d="M9 5l7 7-7 7" />
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

    <Frame name="tabbar" position="absolute" x={0} y={761} w={390} h={83} px={6} pb={34} bg={t.bg} flex="row" stroke={t.line} strokeWidth={1} strokeWeights={{ top: 1 }}>
      <Frame w="fill" h={48} flex="col" justify="center" items="center" gap={4}>
        <Vector w={22} h={22} stroke={t.primary} strokeWidth={1.9} d="M3.5 10.4 12 3.6l8.5 6.8V20a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1z" />
        <Text font={font} size={12} weight={800} color={t.primary}>首页</Text>
      </Frame>
      <Frame w="fill" h={48} flex="col" justify="center" items="center" gap={4}>
        <Vector w={22} h={22} stroke={t.muted} strokeWidth={1.9} d="M4.8 5H19.2A1.6 1.6 0 0 1 20.8 6.6V19.4A1.6 1.6 0 0 1 19.2 21H4.8A1.6 1.6 0 0 1 3.2 19.4V6.6A1.6 1.6 0 0 1 4.8 5ZM8 3v4M16 3v4M3.2 10h17.6M7.5 14.5h2M14.5 14.5h2M7.5 18h2M14.5 18h2" />
        <Text font={font} size={12} weight={600} color={t.muted}>约课</Text>
      </Frame>
      <Frame w="fill" h={48} flex="col" justify="center" items="center" gap={4}>
        <Vector w={22} h={22} stroke={t.muted} strokeWidth={1.9} d="M3.5 8.5v-3a2 2 0 0 1 2-2h3M15.5 3.5h3a2 2 0 0 1 2 2v3M20.5 15.5v3a2 2 0 0 1-2 2h-3M8.5 20.5h-3a2 2 0 0 1-2-2v-3M3.5 12h17" />
        <Text font={font} size={12} weight={600} color={t.muted}>打卡</Text>
      </Frame>
      <Frame w="fill" h={48} flex="col" justify="center" items="center" gap={4}>
        <Vector w={22} h={22} stroke={t.muted} strokeWidth={1.9} d="M4.6 5H19.4A2 2 0 0 1 21.4 7V17A2 2 0 0 1 19.4 19H4.6A2 2 0 0 1 2.6 17V7A2 2 0 0 1 4.6 5ZM2.6 9.6h18.8M6.4 15.2h3.4" />
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
