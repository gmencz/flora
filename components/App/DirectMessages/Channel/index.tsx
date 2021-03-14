import DirectMessagesSidebar from '@/components/App/DirectMessages/Sidebar'
import ServersSidebar from '@/components/App/Servers/Sidebar'
import withAuthenticationRequired from '@/components/Auth/withAuthenticationRequired'
import ChannelMessages from './Messages'
import ChannelHeader from './Header'
import ChannelTextArea from './TextArea'
import { useRouter } from 'next/router'
import 'twin.macro'

export interface ChannelComponentProps {
  channel: string
  dm: string
}

function Channel() {
  const router = useRouter()
  const { channel, dm } = router.query as Record<string, string>

  return (
    <div tw="flex">
      <ServersSidebar />

      <DirectMessagesSidebar />

      <div tw="flex-1 flex flex-col">
        <ChannelHeader channel={channel} dm={dm} />

        <ChannelMessages channel={channel} dm={dm} />

        <ChannelTextArea channel={channel} dm={dm} />
      </div>
    </div>
  )
}

export default withAuthenticationRequired(Channel)
