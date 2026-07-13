import type { Meta, StoryObj } from '@nuxtjs/storybook'

const heartIcon = `
  <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <path stroke-linecap="round" stroke-linejoin="round"
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
`

const saveIcon = `
  <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <path stroke-linecap="round" stroke-linejoin="round"
      d="M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" />
    <path stroke-linecap="round" stroke-linejoin="round" d="M9 9h6M9 13h6M9 17h4" />
  </svg>
`

const publishIcon = `
  <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <path stroke-linecap="round" stroke-linejoin="round"
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
`

const meta = {
  title: 'UI/Buttons',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Button styles from `assets/css/main.css` — `.ds-btn-primary`, `.ds-btn-secondary`, and `.ds-icon-btn`. Apply classes to `<button>` or `<NuxtLink>`.',
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  render: () => ({
    template: '<button type="button" class="ds-btn-primary">Publică poezia</button>',
  }),
}

export const PrimaryDisabled: Story = {
  render: () => ({
    template:
      '<button type="button" class="ds-btn-primary" disabled>Se salvează…</button>',
  }),
}

export const PrimaryCompact: Story = {
  name: 'Primary (compact)',
  parameters: {
    docs: {
      description: {
        story: 'Nav CTA — `!py-1.5 text-sm` as used in `AppNav`.',
      },
    },
  },
  render: () => ({
    template:
      '<button type="button" class="ds-btn-primary !py-1.5 text-sm">Înregistrare</button>',
  }),
}

export const PrimaryFullWidth: Story = {
  name: 'Primary (full width)',
  render: () => ({
    template: `
      <div class="w-full max-w-sm">
        <button type="button" class="ds-btn-primary w-full justify-center py-3 text-sm">
          Autentificare
        </button>
      </div>
    `,
  }),
}

export const IconAndText: Story = {
  name: 'Icon and text',
  parameters: {
    docs: {
      description: {
        story:
          'Icon before label — `gap-2` on `.ds-btn-*`, pattern from `pages/write.vue` save/publish actions.',
      },
    },
  },
  render: () => ({
    template: `
      <div class="flex max-w-md flex-col gap-3 sm:flex-row">
        <button type="button" class="ds-btn-secondary w-full gap-2 shadow-ds-card sm:w-auto">
          ${saveIcon}
          Salvează ciorna
        </button>
        <button type="button" class="ds-btn-primary w-full gap-2 shadow-ds-card sm:w-auto">
          ${publishIcon}
          Publică
        </button>
      </div>
    `,
  }),
}

export const PrimaryWithIcon: Story = {
  name: 'Primary (icon and text)',
  render: () => ({
    template: `
      <button type="button" class="ds-btn-primary gap-2 shadow-ds-card">
        ${publishIcon}
        Publică poezia
      </button>
    `,
  }),
}

export const SecondaryWithIcon: Story = {
  name: 'Secondary (icon and text)',
  render: () => ({
    template: `
      <button type="button" class="ds-btn-secondary gap-2 shadow-ds-card">
        ${saveIcon}
        Salvează ciorna
      </button>
    `,
  }),
}

export const Secondary: Story = {
  render: () => ({
    template: '<button type="button" class="ds-btn-secondary">Anulează</button>',
  }),
}

export const SecondaryDisabled: Story = {
  render: () => ({
    template:
      '<button type="button" class="ds-btn-secondary" disabled>Se șterge…</button>',
  }),
}

export const SecondaryAsLink: Story = {
  name: 'Secondary (link-style)',
  parameters: {
    docs: {
      description: {
        story: 'Often used on `<NuxtLink>` — here shown as a plain anchor for isolation.',
      },
    },
  },
  render: () => ({
    template:
      '<a href="#" class="ds-btn-secondary inline-flex shrink-0" @click.prevent>Scrie poezie</a>',
  }),
}

export const IconButton: Story = {
  render: () => ({
    template: `
      <button
        type="button"
        class="ds-icon-btn"
        aria-label="Favorite"
      >
        ${heartIcon}
      </button>
    `,
  }),
}

export const IconButtonFavorites: Story = {
  name: 'Icon button (favorites)',
  parameters: {
    docs: {
      description: {
        story: 'Rose accent on hover — pattern from `AppNav` favorites control.',
      },
    },
  },
  render: () => ({
    template: `
      <button
        type="button"
        class="ds-icon-btn border-edge-subtle text-content-muted hover:border-brand/40 hover:bg-brand-tint hover:text-brand"
        aria-label="Favorite"
      >
        ${heartIcon}
      </button>
    `,
  }),
}

export const AllVariants: Story = {
  name: 'All variants',
  render: () => ({
    template: `
      <div class="flex max-w-lg flex-col gap-6">
        <section class="flex flex-wrap items-center gap-3">
          <span class="ds-eyebrow w-full">Primary</span>
          <button type="button" class="ds-btn-primary">Publică</button>
          <button type="button" class="ds-btn-primary gap-2 shadow-ds-card">
            ${publishIcon}
            Cu iconiță
          </button>
          <button type="button" class="ds-btn-primary !py-1.5 text-sm">Compact</button>
          <button type="button" class="ds-btn-primary" disabled>Disabled</button>
        </section>
        <section class="flex flex-wrap items-center gap-3">
          <span class="ds-eyebrow w-full">Secondary</span>
          <button type="button" class="ds-btn-secondary">Anulează</button>
          <button type="button" class="ds-btn-secondary gap-2 shadow-ds-card">
            ${saveIcon}
            Cu iconiță
          </button>
          <button type="button" class="ds-btn-secondary px-5">Modal action</button>
          <button type="button" class="ds-btn-secondary" disabled>Disabled</button>
        </section>
        <section class="flex flex-wrap items-center gap-3">
          <span class="ds-eyebrow w-full">Icon</span>
          <button type="button" class="ds-icon-btn" aria-label="Favorite">
            ${heartIcon}
          </button>
          <button
            type="button"
            class="ds-icon-btn border-edge-subtle text-content-muted hover:border-brand/40 hover:bg-brand-tint hover:text-brand"
            aria-label="Favorite"
          >
            ${heartIcon}
          </button>
        </section>
        <section class="w-full max-w-xs">
          <span class="ds-eyebrow">Full width</span>
          <button type="button" class="ds-btn-primary mt-2 w-full justify-center py-3 text-sm">
            Autentificare
          </button>
        </section>
      </div>
    `,
  }),
}
