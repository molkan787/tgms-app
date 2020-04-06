<template>
  <v-row justify="center">
    <v-dialog v-model="open" persistent max-width="360">
      <v-card>
        <v-card-title class="headline">Data folder</v-card-title>
        <v-card-text>
            Select and existing data folder or specify where to create new one.
            <div class="spc"></div>
            <v-text-field @click="selectDir" :value="currentDir" label="Data folder" readonly :disabled="loading" outlined dense hide-details />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="okClick" :loading="loading">Ok</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script>
import utils from '../logic/utils'

export default {
    data:() => ({
        open: true,
        loading: false,
        currentDir: 'D:\\TGMS-Marketing'
    }),

    methods: {
        async okClick(){
            if(!this.currentDir){
                alert('Please a folder.', 'TGMS')
                return
            }
            this.loading = true
            await startInit(this.currentDir)
            this.open = false
        },
        async selectDir(){
            const dir = await utils.promptDirectory()
            console.log(dir)
            if(dir) this.currentDir = dir
        }
    },

    mounted(){
      const path = req('path')
      const dir = path.join(app.getPath('documents'), 'TGMS Marketing')
      this.currentDir = dir
      console.log(this.currentDir)
      this.okClick()
    }
}
</script>

<style>
.spc{
   height: 20px;
}
</style>