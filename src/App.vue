<template>
  <v-app>

    <v-content>
      <Accounts/>
    </v-content>
    <AddAccount />
    <Actions />
    <ScrapeMembers />
    <DataDirSelector />
    <Dialog />

  </v-app>
</template>

<script>
import Accounts from './components/Accounts';
import AddAccount from './components/AddAccount';
import Actions from './components/Actions';
import Dialog from './components/Dialog';
import DataDirSelector from './components/DataDirSelector';
import ScrapeMembers from './components/ScrapeMembers'

export default {
  name: 'App',
  components: {
    Accounts,
    AddAccount,
    Dialog,
    Actions,
    DataDirSelector,
    ScrapeMembers
  }
};
</script>
