'use client'

// import 'regenerator-runtime/runtime'
import { Flex } from '@radix-ui/themes'
import _ from 'lodash'
import { AudioThreadContext } from '@/contexts/threads/AudioThreadContext'
import { useCreateMessage } from '@/hooks/messages/useCreateMessage'
import { usePermission } from '@/hooks/misc/usePermission'
import { blobToData } from './lib/blobToData'
import { useStatus } from '@/hooks/audioThreads/useStatus'
import { useRecorder } from '@/hooks/audioThreads/useRecorder'
import { useMessageAudio } from '@/hooks/audioThreads/useMessageAudio'
import {
  useQueryClient,
} from '@tanstack/react-query'
import { useThreadContext } from '@/hooks/threads/useThreadContext'
import { useToasts } from '@/hooks/toasts/useToasts'
import { createMessageDefaultOnError } from '@/lib/errors/createMessageDefaultOnError'
import { ToastsProvider } from '@/components/toasts/ToastsProvider'

export type Args = {
  children: React.ReactNode
}

const Content = ({
  children,
}: Args) => {
  const { addToast } = useToasts()
  const queryClient = useQueryClient()
  const threadContext = useThreadContext()

  const createMessageProps = useCreateMessage({
    onError: (error: unknown) => {
      createMessageDefaultOnError({
        queryClient,
        addToast,
        threadContext,
      })(error)

      recorderProps.start()
    }
  })

  const recorderProps = useRecorder({
    isStopOnSilence: true,
    onStart: async () => {
    },
    onStop: async (_event: any, chunks: BlobPart[]) => {
      // @ts-ignore-next-line
      const blob = new Blob(chunks, { type: chunks[0].type })
      const audioContent = await blobToData(blob)

      return createMessageProps.createMessage({
        // @ts-ignore-next-line
        audioContent,
      })
    },
  })

  const microphonePermission = usePermission({ name: 'microphone' })

  const messageAudioProps = useMessageAudio({
    onEnd: () => {
      if (microphonePermission === 'granted') {
        recorderProps.start()
      }
    }
  })

  const { status } = useStatus({
    recorderProps,
    createMessageProps,
    messageAudioProps,
  })

  return (
    <AudioThreadContext.Provider
      value={{
        status,
        recorderProps,
        messageAudioProps,
      }}
    >
      <Flex
        direction="column"
        flexGrow="1"
        p="9"
      >
        {children}
      </Flex>
    </AudioThreadContext.Provider>
  )
}

export const Root = ({
  children,
}: Args) => (
  <ToastsProvider>
    <Content>
      {children}
    </Content>
  </ToastsProvider>
)
