import { defineStore } from 'pinia'

interface ConditionDecisionState {
  visible: boolean
  title: string
  message: string
  passText: string
  failText: string
}

let resolver: ((value: boolean) => void) | null = null

export const useConditionDecisionStore = defineStore('conditionDecision', {
  state: (): ConditionDecisionState => ({
    visible: false,
    title: 'Condition Decision',
    message: '',
    passText: 'Pass',
    failText: 'Fail'
  }),

  actions: {
    requestDecision(message: string, title = 'Condition Decision', passText = 'Pass', failText = 'Fail'): Promise<boolean> {
      this.message = message
      this.title = title
      this.passText = passText
      this.failText = failText
      this.visible = true

      return new Promise(resolve => {
        resolver = resolve
      })
    },

    choosePass() {
      this.visible = false
      if (resolver) {
        resolver(true)
        resolver = null
      }
    },

    chooseFail() {
      this.visible = false
      if (resolver) {
        resolver(false)
        resolver = null
      }
    }
  }
})