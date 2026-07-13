import type { Meta, StoryObj } from '@nuxtjs/storybook'
import type { AuthUser } from '~/composables/useAuth'
import AppNav from './AppNav.vue'

function withAuthUser(user: AuthUser | null) {
  return () => ({
    setup() {
      const authUser = useState<AuthUser | null>('auth_user', () => user)
      authUser.value = user
      return {}
    },
    template: '<story />',
  })
}

const meta = {
  title: 'Layout/AppNav',
  component: AppNav,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Site header with desktop nav, mobile drawer, and auth-aware actions.',
      },
    },
  },
  decorators: [
    () => ({
      template:
        '<div class="min-h-[12rem] bg-surface-page text-content" data-color-scheme="paper"><story /></div>',
    }),
  ],
} satisfies Meta<typeof AppNav>

export default meta
type Story = StoryObj<typeof meta>

export const Guest: Story = {
  decorators: [withAuthUser(null)],
}

export const LoggedIn: Story = {
  decorators: [
    withAuthUser({
      id: 'user-1',
      email: 'poet@poetryhub.ro',
      name: 'Ana Poet',
      role: 'user',
    }),
  ],
}

export const LoggedInWithGooglePhoto: Story = {
  decorators: [
    withAuthUser({
      id: 'user-google',
      email: 'ana@gmail.com',
      name: 'Ana Poet',
      role: 'user',
      imageUrl: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
    }),
  ],
}

export const Admin: Story = {
  decorators: [
    withAuthUser({
      id: 'admin-1',
      email: 'admin@poetryhub.ro',
      name: 'Admin',
      role: 'admin',
    }),
  ],
}
