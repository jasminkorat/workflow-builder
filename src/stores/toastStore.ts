import { defineStore } from 'pinia'

export type ToastType = 'success' | 'error' | 'info'

interface ToastState {
  message: string
  type: ToastType
  visible: boolean
}

let hideTimeout: number | null = null

export const useToastStore = defineStore('toast', {
  state: (): ToastState => ({
    message: '',
    type: 'success',
    visible: false
  }),

  actions: {
    showToast(message: string, type: ToastType = 'success', duration = 2000) {
      this.message = message
      this.type = type
      this.visible = true

      if (hideTimeout) {
        window.clearTimeout(hideTimeout)
        hideTimeout = null
      }

      hideTimeout = window.setTimeout(() => {
        this.visible = false
      }, duration)
    }
  }
})
