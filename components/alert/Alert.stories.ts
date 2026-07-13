import type { Meta, StoryObj } from '@nuxtjs/storybook'
import { Icon } from '@iconify/vue'
import Alert from './Alert.vue'
import AlertTitle from './AlertTitle.vue'
import AlertDescription from './AlertDescription.vue'
import AlertAction from './AlertAction.vue'

const meta = {
  title: 'UI/Alert',
  component: Alert,
  tags: ['autodocs'],
  args: {
    variant: 'default',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'warning', 'success', 'info'],
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Callout for user attention. Compose with `AlertTitle`, `AlertDescription`, `AlertAction`, and optional `#icon` slot.',
      },
    },
  },
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { Alert, AlertTitle, AlertDescription, Icon },
    setup() {
      return { args }
    },
    template: `
      <Alert v-bind="args" class="max-w-md">
        <template #icon>
          <Icon icon="heroicons:information-circle" aria-hidden="true" />
        </template>
        <AlertTitle>Funcție nouă disponibilă</AlertTitle>
        <AlertDescription>
          Am adăugat suport pentru teme de culoare. Poți schimba aspectul din setările contului.
        </AlertDescription>
      </Alert>
    `,
  }),
}

export const Destructive: Story = {
  args: { variant: 'destructive' },
  render: (args) => ({
    components: { Alert, AlertTitle, AlertDescription, Icon },
    setup() {
      return { args }
    },
    template: `
      <Alert v-bind="args" class="max-w-md">
        <template #icon>
          <Icon icon="heroicons:exclamation-circle" aria-hidden="true" />
        </template>
        <AlertTitle>Plata a eșuat</AlertTitle>
        <AlertDescription>
          Plata nu a putut fi procesată. Verifică metoda de plată și încearcă din nou.
        </AlertDescription>
      </Alert>
    `,
  }),
}

export const Warning: Story = {
  args: { variant: 'warning' },
  render: (args) => ({
    components: { Alert, AlertTitle, AlertDescription, Icon },
    setup() {
      return { args }
    },
    template: `
      <Alert v-bind="args" class="max-w-md">
        <template #icon>
          <Icon icon="heroicons:exclamation-triangle" aria-hidden="true" />
        </template>
        <AlertTitle>Abonamentul expiră în 3 zile</AlertTitle>
        <AlertDescription>
          Reînnoiește acum pentru a evita întreruperea serviciului.
        </AlertDescription>
      </Alert>
    `,
  }),
}

export const Success: Story = {
  args: { variant: 'success' },
  render: (args) => ({
    components: { Alert, AlertTitle, AlertDescription, Icon },
    setup() {
      return { args }
    },
    template: `
      <Alert v-bind="args" class="max-w-md">
        <template #icon>
          <Icon icon="heroicons:check-circle" aria-hidden="true" />
        </template>
        <AlertTitle>Cont actualizat cu succes</AlertTitle>
        <AlertDescription>
          Informațiile profilului au fost salvate. Modificările sunt vizibile imediat.
        </AlertDescription>
      </Alert>
    `,
  }),
}

export const Info: Story = {
  args: { variant: 'info' },
  render: (args) => ({
    components: { Alert, AlertTitle, AlertDescription, Icon },
    setup() {
      return { args }
    },
    template: `
      <Alert v-bind="args" class="max-w-md">
        <template #icon>
          <Icon icon="heroicons:light-bulb" aria-hidden="true" />
        </template>
        <AlertTitle>Sfat pentru scriere</AlertTitle>
        <AlertDescription>
          Folosește rânduri scurte și pauze vizibile — cititorii apreciază respirația versurilor.
        </AlertDescription>
      </Alert>
    `,
  }),
}

export const WithoutIcon: Story = {
  render: (args) => ({
    components: { Alert, AlertTitle, AlertDescription },
    setup() {
      return { args }
    },
    template: `
      <Alert v-bind="args" class="max-w-md">
        <AlertTitle>Doar titlu și descriere</AlertTitle>
        <AlertDescription>
          Fără iconiță — grila se adaptează automat.
        </AlertDescription>
      </Alert>
    `,
  }),
}

export const WithAction: Story = {
  render: (args) => ({
    components: { Alert, AlertTitle, AlertDescription, AlertAction, Icon },
    setup() {
      return { args }
    },
    template: `
      <Alert v-bind="args" class="max-w-md">
        <AlertTitle>Modul întunecat disponibil</AlertTitle>
        <AlertDescription>
          Activează-l din setările profilului pentru o experiență mai confortabilă seara.
        </AlertDescription>
        <AlertAction>
          <button type="button" class="ds-btn-secondary !px-3 !py-1.5 text-xs">
            Activează
          </button>
        </AlertAction>
      </Alert>
    `,
  }),
}

export const AllVariants: Story = {
  name: 'All variants',
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription, Icon },
    template: `
      <div class="grid w-full max-w-md items-start gap-4">
        <Alert variant="default">
          <template #icon>
            <Icon icon="heroicons:information-circle" aria-hidden="true" />
          </template>
          <AlertTitle>Implicit</AlertTitle>
          <AlertDescription>Mesaj informativ standard.</AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <template #icon>
            <Icon icon="heroicons:exclamation-circle" aria-hidden="true" />
          </template>
          <AlertTitle>Eroare</AlertTitle>
          <AlertDescription>Ceva nu a funcționat.</AlertDescription>
        </Alert>
        <Alert variant="warning">
          <template #icon>
            <Icon icon="heroicons:exclamation-triangle" aria-hidden="true" />
          </template>
          <AlertTitle>Atenție</AlertTitle>
          <AlertDescription>Acțiune necesară în curând.</AlertDescription>
        </Alert>
        <Alert variant="success">
          <template #icon>
            <Icon icon="heroicons:check-circle" aria-hidden="true" />
          </template>
          <AlertTitle>Succes</AlertTitle>
          <AlertDescription>Operațiune finalizată.</AlertDescription>
        </Alert>
        <Alert variant="info">
          <template #icon>
            <Icon icon="heroicons:light-bulb" aria-hidden="true" />
          </template>
          <AlertTitle>Info</AlertTitle>
          <AlertDescription>Sfat sau detaliu util.</AlertDescription>
        </Alert>
      </div>
    `,
  }),
}
