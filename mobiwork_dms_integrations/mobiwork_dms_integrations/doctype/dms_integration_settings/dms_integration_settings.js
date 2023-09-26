// Copyright (c) 2023, LinhFrappe and contributors
// For license information, please see license.txt

async function get_fields_webhook(doctype) {
  var fields = [];
  await frappe.model.with_doctype(doctype, () => {
    // get doctype fields
    fields = $.map(frappe.get_doc("DocType", doctype).fields, (d) => {
      if (
        frappe.model.no_value_type.includes(d.fieldtype) &&
        !frappe.model.table_fields.includes(d.fieldtype)
      ) {
        return null;
      } else {
        return { fieldname: d.fieldname, key: d.fieldname };
      }
    });

    // add meta fields
    for (let field of frappe.model.std_fields) {
      if (field.fieldname == "name") {
        fields.unshift({
          fieldname: field.fieldname,
          key: field.fieldname,
        });
      } else {
        fields.push({ fieldname: field.fieldname, key: field.fieldname });
      }
    }
  });

  return fields;
}

frappe.ui.form.on("DMS Integration Settings", {
  refresh: function (frm) {
    var base_url = window.location.origin;
    if (
      frm.doc.id_wh_item_cu ||
      frm.doc.id_wh_customer_cu ||
      frm.doc.id_wh_order_cu
    ) {
      var html = `<div class="mb-4">
          <h5>The URLs are configured by webhooks</h5>
      `;

      if (frm.doc.id_wh_item_cu) {
        html += `<div class="mt-2"><strong>URL Webhook Item</strong>`;
        html += `<div>
        <strong>+ </strong><strong class="text-primary">${frm.doc.url_site_dms}/Frappe/Item/InsertUpdate</strong>: <a href="${base_url}/app/webhook/${frm.doc.id_wh_item_cu}"><strong>${frm.doc.id_wh_item_cu}</strong></a> CREATE or UPDATE for Item
        </div>`;
        html += `<div>
        <strong>+ </strong><strong class="text-primary">${frm.doc.url_site_dms}/Frappe/Item/Delete</strong>: <a href="${base_url}/app/webhook/${frm.doc.id_wh_item_d}"><strong>${frm.doc.id_wh_item_d}</strong></a> DELETE for Item
        </div></div>`;
      }

      if (frm.doc.id_wh_customer_cu) {
        html += `<div class="mt-2"><strong>URL Webhook Customer</strong>`;
        html += `<div>
          <strong>+ </strong><strong class="text-primary">${frm.doc.url_site_dms}/Frappe/Customer/InsertUpdate</strong>: <a href="${base_url}/app/webhook/${frm.doc.id_wh_customer_cu}"><strong>${frm.doc.id_wh_customer_cu}</strong></a> CREATE or UPDATE for Customer
          </div>`;
        html += `<div>
          <strong>+ </strong><strong class="text-primary">${frm.doc.url_site_dms}/Frappe/Customer/Delete</strong>: <a href="${base_url}/app/webhook/${frm.doc.id_wh_customer_d}"><strong>${frm.doc.id_wh_customer_d}</strong></a> DELETE for Customer
          </div></div>`;
      }

      if (frm.doc.id_wh_order_cu) {
        html += `<div class="mt-2"><strong>URL Webhook Order</strong>`;
        html += `<div>
          <strong>+ </strong><strong class="text-primary">${frm.doc.url_site_dms}/Frappe/Order/InsertUpdate</strong>: <a href="${base_url}/app/webhook/${frm.doc.id_wh_order_cu}"><strong>${frm.doc.id_wh_order_cu}</strong></a> CREATE or UPDATE for Order
          </div>`;
        html += `<div>
          <strong>+ </strong><strong class="text-primary">${frm.doc.url_site_dms}/Frappe/Order/Delete</strong>: <a href="${base_url}/app/webhook/${frm.doc.id_wh_order_d}"><strong>${frm.doc.id_wh_order_d}</strong></a> DELETE for Order
          </div></div>`;
      }
      html += `</div>`;
      $(frm.fields_dict.note_html.wrapper).html(html);
    }
  },

  before_save: async function (frm) {
    if (!frm.is_dirty()) return false;

    var webhook_data = {};
    if (frm.doc.wh_item) {
      webhook_data.item_fields = await get_fields_webhook("Item");
    }
    if (frm.doc.wh_customer) {
      webhook_data.customer_fields = await get_fields_webhook("Customer");
    }
    if (frm.doc.wh_order) {
      webhook_data.order_fields = await get_fields_webhook("Sales Order");
    }

    await frappe.call({
      method: "handle_webhook",
      doc: frm.doc,
      args: {
        webhook_data: webhook_data,
      },
      callback: function (r, rt) {
        if (r.message) {
          // console.log("done");
        } else {
          frm.set_value("check_doc", 1);
        }
      },
      error: (r) => {
        frappe.msgprint({
          title: __("Error"),
          indicator: "red",
          message: __("Error! An error occurred."),
        });
      },
    });
  },
});
