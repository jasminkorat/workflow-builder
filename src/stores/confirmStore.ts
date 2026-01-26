import { defineStore } from 'pinia'

interface ConfirmState {
  visible: boolean
  title: string
  message: string
  confirmText: string
  cancelText: string
}

let resolver: ((value: boolean) => void) | null = null

export const useConfirmStore = defineStore('confirm', {
  state: (): ConfirmState => ({
    visible: false,
    title: 'Confirm',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  }),

  actions: {
    requestConfirm(
      message: string,
      title = 'Confirm',
      confirmText = 'Confirm',
      cancelText = 'Cancel'
    ): Promise<boolean> {
      this.message = message
      this.title = title
      this.confirmText = confirmText
      this.cancelText = cancelText
      this.visible = true

      return new Promise(resolve => {
        resolver = resolve
      })
    },

    confirm() {
      this.visible = false
      if (resolver) {
        resolver(true)
        resolver = null
      }
    },

    cancel() {
      this.visible = false
      if (resolver) {
        resolver(false)
        resolver = null
      }
    }
  }
})
