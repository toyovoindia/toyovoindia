export const formatTransactionRow = (order) => {
  const raw = order.paymentGateway?.rawResponse || {};
  const isPayu = order.paymentGateway?.provider === 'payu';
  const isPhonepe = order.paymentGateway?.provider === 'phonepe';

  // Helper to safely extract raw fields or default to empty string
  const getRaw = (payuKey, phonepeKey) => {
    if (isPayu && raw[payuKey] !== undefined) return raw[payuKey];
    if (isPhonepe && raw[phonepeKey] !== undefined) return raw[phonepeKey];
    return '';
  };

  // Helper for dates
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return d.toISOString().replace('T', ' ').substring(0, 19);
    } catch {
      return dateString;
    }
  };

  return {
    status: getRaw('status', 'code') || order.status,
    txnid: order.paymentGateway?.payuTxnId || getRaw('txnid', 'transactionId') || order.orderNumber,
    addedon: formatDate(getRaw('addedon', 'createdAt')) || formatDate(order.createdAt),
    success_at: order.paymentStatus === 'paid' ? (formatDate(getRaw('addedon', 'updatedAt')) || formatDate(order.paymentGateway?.verifiedAt)) : '',
    id: getRaw('mihpayid', 'providerReferenceId'),
    amount: order.totalAmount?.toFixed(2) || '0.00',
    productinfo: getRaw('productinfo', 'productinfo') || 'Toyovo_Order',
    firstname: order.customer?.firstName || '',
    lastname: order.customer?.lastName || '',
    email: order.customer?.email || '',
    phone: order.customer?.phone || '',
    ip: getRaw('ip', 'ip'),
    city: order.shippingAddress?.city || '',
    merchant_name: 'TOYOVO INDIA (OPC) PRIVATE LIMITED',
    merchant_id: getRaw('key', 'merchantId'),
    bank_name: getRaw('bank_name', 'bank_name'),
    bank_ref_no: getRaw('bank_ref_num', 'providerReferenceId'),
    cardtype: getRaw('cardCategory', 'cardType'),
    mode: getRaw('mode', 'paymentInstrument.type'),
    error_code: getRaw('error_code', 'code'),
    errorDescription: getRaw('error_Message', 'message'),
    error_message: getRaw('error_Message', 'message'),
    pgmid: getRaw('pg_TYPE', 'pgmid'),
    pg_response: getRaw('unmappedstatus', 'responseCode'),
    issuing_bank: getRaw('issuing_bank', 'issuingBank'),
    payment_source: getRaw('payment_source', 'payment_source'),
    name_on_card: getRaw('name_on_card', 'nameOnCard'),
    card_number: getRaw('cardnum', 'last4'),
    address_line1: order.shippingAddress?.address || '',
    address_line2: order.shippingAddress?.apartment || '',
    state: order.shippingAddress?.state || '',
    country: order.shippingAddress?.country || 'India',
    zipcode: order.shippingAddress?.postalCode || '',
    shipping_firstname: order.shippingAddress?.firstName || '',
    shipping_lastname: order.shippingAddress?.lastName || '',
    shipping_address1: order.shippingAddress?.address || '',
    shipping_address2: order.shippingAddress?.apartment || '',
    shipping_city: order.shippingAddress?.city || '',
    shipping_state: order.shippingAddress?.state || '',
    shipping_country: order.shippingAddress?.country || 'India',
    shipping_zipcode: order.shippingAddress?.postalCode || '',
    shipping_phone: order.shippingAddress?.phone || '',
    transaction_fee: getRaw('transaction_fee', 'transaction_fee') || '0.00',
    discount: order.discountAmount?.toFixed(2) || '0.00',
    additional_charges: getRaw('additionalCharges', 'additionalCharges') || '0.00',
    'amount(inr)': order.totalAmount?.toFixed(2) || '0.00',
    udf1: getRaw('udf1', 'udf1'),
    udf2: getRaw('udf2', 'udf2'),
    udf3: getRaw('udf3', 'udf3'),
    udf4: getRaw('udf4', 'udf4'),
    udf5: getRaw('udf5', 'udf5'),
    field0: getRaw('field0', 'field0'),
    field1: getRaw('field1', 'field1'),
    field2: getRaw('field2', 'field2'),
    field3: getRaw('field3', 'field3'),
    field4: getRaw('field4', 'field4'),
    field5: getRaw('field5', 'field5'),
    field6: getRaw('field6', 'field6'),
    field7: getRaw('field7', 'field7'),
    field8: getRaw('field8', 'field8'),
    device_info: getRaw('device_info', 'device_info'),
    merchant_subvention_amount: getRaw('merchant_subvention_amount', 'merchant_subvention_amount'),
    utr: getRaw('bank_ref_num', 'utr'),
    recon_ref_number: getRaw('bank_ref_num', 'recon_ref_number'),
    settlement_amount: getRaw('net_amount_debit', 'settlement_amount') || order.totalAmount?.toFixed(2),
    settlement_date: getRaw('settlement_date', 'settlement_date'),
    service_fees: getRaw('service_fees', 'service_fees'),
    tsp_charges: getRaw('tsp_charges', 'tsp_charges'),
    convenience_fee: getRaw('convenience_fee', 'convenience_fee'),
    cgst: getRaw('cgst', 'cgst'),
    sgst: getRaw('sgst', 'sgst'),
    igst: getRaw('igst', 'igst'),
    token_bin: getRaw('token_bin', 'token_bin'),
    last_four_digits: getRaw('cardnum', 'last4'),
    arn: getRaw('arn', 'arn'),
    auth_code: getRaw('auth_code', 'auth_code'),
    conversion_status: getRaw('conversion_status', 'conversion_status'),
    conversion_date: getRaw('conversion_date', 'conversion_date'),
    conversion_remarks: getRaw('conversion_remarks', 'conversion_remarks'),
    mer_service_fee: getRaw('mer_service_fee', 'mer_service_fee'),
    currency_type: order.currency || 'INR',
    network_type: getRaw('bankcode', 'network_type'),
    unmapped_status: getRaw('unmappedstatus', 'unmapped_status'),
    category: getRaw('category', 'category'),
    sub_category: getRaw('sub_category', 'sub_category')
  };
};
