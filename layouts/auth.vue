<!-- Full-page auth screens (login/signup). Named layout avoids `layout: false` → default transitions that can skip remounting the shell with AppNav. -->
<template>
  <div class="min-h-screen w-full">
    <slot />
  </div>
</template>
