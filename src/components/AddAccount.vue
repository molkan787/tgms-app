<template>
  <v-dialog v-model="open" max-width="300" persistent>
    <v-card :loading="loading">
      <v-card-title class="headline">Add New User</v-card-title>

      <v-card-text style="padding-top: 10px">
        <template v-if="step == 'start'">
          <p>Enter phone number to start</p>
          <v-text-field v-model="form.phone" label="Phone number" outlined dense />
        </template>

        <template v-else-if="step == 'code'">
          <p>A verification code was sent via SMS</p>
          <v-text-field v-model="form.code" label="Verification code" outlined dense />
          <!-- <a @click="resendCode">Resend code</a> -->
        </template>

        <template v-else-if="step == 'userData'">
          <p>Phone number is not registered yet, Fill in the required information to register the number.</p>
          <v-text-field v-model="form.firstname" label="First name" outlined dense />
          <v-text-field v-model="form.lastname" label="Last name" outlined dense />
        </template>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="open = false">Cancel</v-btn>
        <v-btn color="blue darken-1" text @click="continueStep">Continue</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import TLWebNode from "../logic/TLWebNode";
import Logic from '../logic';

export default {
  data: () => ({
    open: false,
    loading: false,
    step: "start",

    form: {
      phone: "",
      code: "",
    },

    tlb: null,
    codeCallback: null
  }),

  methods: {
    clearForm() {
      this.form = {
        phone: "",
        code: ""
      };
    },
    async resendCode(){
        this.loading = true;
        await this.tlb.resendCode();
        this.loading = false;
    },
    continueStep() {
      if (this.step == "start") {
        const phone = this.form.phone.replace(/\s/g, '');
        if (phone.length < 8) {
          alert("Please enter a valid phone number.", "Invalid input");
          return;
        }
        if(Logic.accountExist(phone)){
          alert('An account with this phone number is already added.', 'TGMS');
          return;
        }
        this.loading = true;
        this.startProcess(phone);

      } else if (this.step == "code") {

        if (this.form.code.trim().length < 3) {
          alert("Please enter a valid verification code.", "Invalid input");
          return;
        }
        this.loading = true;
        this.codeCallback(this.form.code.trim());

      }
    },

    async startProcess(phone) {
      this.tlb = Logic.newTLWebNode();
      window.tlb = this.tlb;
      this.tlb.on("requestCode", cb => {
        this.codeCallback = cb;
        this.step = "code";
        this.loading = false;
      });
      this.tlb.on('errorCodeInvalid', () => {
        this.form.code = '';
        alert("Invalid verification code", 'TGMS');
      });
      try {
        const num = phone.charAt(0) == "+" ? phone : "+" + phone;
        const resp = await this.tlb.login(num);
        console.log("resp:", resp);

        Logic.addAccountFromTLWebNode(this.tlb);
        this.open = false;
        alert("User was successfully added!");
      } catch (error) {
        if (error.type == "PHONE_CODE_INVALID") {
          alert("Invalid verification code", 'TGMS');
        } else {
          this.open = false;
          console.error(error)
          alert("An error occured, " + error, 'Error');
        }
      }
    }
  },

  created() {
    window.showAddAccountForm = () => {
      this.clearForm();
      this.step = "start";
      this.loading = false;
      this.open = true;
    };
  }
};
</script>

<style>
</style>