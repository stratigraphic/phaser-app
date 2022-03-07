<template>
    <b-modal centered
        id="modalFileOpenFromURL"
        ref="modal"
        title="Open from URL"
        @show="resetModal"
        @hidden="resetModal"
        @ok="handleOk">
        <form ref="form" @submit.stop.prevent="handleSubmit">
            <b-form-group
                label="URL"
                label-for="url-input"
                invalid-feedback="URL is required"
                :state="urlState">
                <b-form-input
                    id="url-input"
                    v-model="url"
                    :state="urlState"
                    required>
                </b-form-input>
            </b-form-group>
        </form>
    </b-modal>
</template>

<script>
//import PhaserCommon from '@/composables/PhaserCommon'

export default {
    data() {
        return {
            url: '',
            urlState: null,
            submittedURL: ""
        }
    },
    //mixins: [ PhaserCommon ],
    methods: {
      checkFormValidity() {
        const valid = this.$refs.form.checkValidity()
        this.urlState = valid
        return valid
      },
      resetModal() {
        this.url = ''
        this.urlState = null
      },
      handleOk(bvModalEvt) {
        // Prevent modal from closing
        bvModalEvt.preventDefault()
        // Trigger submit handler
        this.handleSubmit()
      },
      handleSubmit() {
        // Exit when the form isn't valid
        if (!this.checkFormValidity()) {
          return
        }   
        // get the data from the remote file
        let self = this
        self.getJSON(this.url, data => {
            self.$store.dispatch('loadMatrixData', data)
		}, err => { console.log(err) })
        // Hide the modal manually
        this.$nextTick(() => {
          this.$bvModal.hide("modalFileOpenFromURL")
        })
      }
    }
  }
</script>

<style scoped>
</style>