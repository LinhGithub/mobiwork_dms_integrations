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

function section_html(title, base_url, url_site_dms, id_cu, id_d, active) {
  var html = `<div class="mt-2"><strong>${title}</strong>`;
  html += `<div>
        <strong>+ </strong><strong class="text-primary">${url_site_dms}/Frappe/Item/InsertUpdate</strong>: <a href="${base_url}/app/webhook/${id_cu}"><strong>${id_cu} <span class="${active.class_name}">(${active.status})</span></strong></a> CREATE or UPDATE for Item
        </div>`;
  html += `<div>
        <strong>+ </strong><strong class="text-primary">${url_site_dms}/Frappe/Item/Delete</strong>: <a href="${base_url}/app/webhook/${id_d}"><strong>${id_d} <span class="${active.class_name}">(${active.status})</span></strong></a> DELETE for Item
        </div></div>`;
  return html;
}

frappe.ui.form.on("DMS Integration Settings", {
  refresh: function (frm) {
    var base_url = window.location.origin;
    var html = "";
    var actives = {
      item: {
        status: "OFF",
        class_name: "text-danger",
      },
      customer: {
        status: "OFF",
        class_name: "text-danger",
      },
      order: {
        status: "OFF",
        class_name: "text-danger",
      },
    };
    if (frm.doc.wh_item) {
      actives.item.status = "ON";
      actives.item.class_name = "text-success";
    }
    if (frm.doc.wh_customer) {
      actives.customer.status = "ON";
      actives.customer.class_name = "text-success";
    }
    if (frm.doc.wh_order) {
      actives.order.status = "ON";
      actives.order.class_name = "text-success";
    }

    if (
      frm.doc.id_wh_item_cu ||
      frm.doc.id_wh_customer_cu ||
      frm.doc.id_wh_order_cu
    ) {
      html = `<div class="mb-4">
          <h5>The URLs are configured by webhooks</h5>
      `;

      if (frm.doc.id_wh_item_cu) {
        html += section_html(
          "URL Webhook Item",
          base_url,
          frm.doc.url_site_dms,
          frm.doc.id_wh_item_cu,
          frm.doc.id_wh_item_d,
          actives.item
        );
      }

      if (frm.doc.id_wh_customer_cu) {
        html += section_html(
          "URL Webhook Customer",
          base_url,
          frm.doc.url_site_dms,
          frm.doc.id_wh_customer_cu,
          frm.doc.id_wh_customer_d,
          actives.customer
        );
      }

      if (frm.doc.id_wh_order_cu) {
        html += section_html(
          "URL Webhook Order",
          base_url,
          frm.doc.url_site_dms,
          frm.doc.id_wh_order_cu,
          frm.doc.id_wh_order_d,
          actives.order
        );
      }
      html += `</div>`;
    }
    $(frm.fields_dict.note_html.wrapper).html(html);
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

    frappe.show_progress("Installing Webhooks..", 0, 100, "Please wait");

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
