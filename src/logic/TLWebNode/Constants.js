const BASE_URL = 'http://localhost:8000/#/'
const obj = {
    BASE_URL,
    LOGIN_URL: BASE_URL + 'login',
    HOME_URL: BASE_URL + 'im',
    PEER_BASE_URL: BASE_URL + 'im?p=@',

    SEL_LOGIN_NUMBER: 'input[name="phone_number"]',
    SEL_LOGIN_COUNTRYCODE: 'input[name="phone_country"]',
    SEL_LOGIN_NEXT: 'a[ng-click="sendCode()"]',
    SEL_LOGIN_OK: 'button[ng-click="$close(data)"]',
    SEL_LOGIN_CODE: 'input[name="phone_code"]',
    SEL_LOGIN_INCORRECT_CODE: 'label[my-i18n="login_incorrect_sms_code"]',
    SEL_HOME_ELEMENT: 'input[ng-model="search.query"]',

    SEL_PEER_HEAD: 'a[ng-click="showPeerInfo()"]',
    SEL_MEMBERS_AREA: 'div.md_modal_iconed_section_wrap.md_modal_iconed_section_peers',
    SEL_SEARCHBOX: 'input[ng-model="search.query"]',
    SEL_SEARCH_IMDIALOG: 'a.im_dialog',
    SEL_MESSAGE_INPUT: 'div.composer_rich_textarea',
    SEL_SUBMIT_MESSAGE_BTN: 'span.im_submit_send_label.nocopy',

    SEL_INVITE_BTN: 'a[ng-click="inviteToChannel()"]',
    SEL_CONTACT_ITEM: 'a.contacts_modal_contact',
    SEL_SUBMIT_SELECTED_BTN: 'button[ng-click="submitSelected()"]',

    SEL_MODAL_CLOSE_PAN: 'div.modal_close_wrap[ng-click="close($event)"]'
}

Object.freeze(obj)
export default obj