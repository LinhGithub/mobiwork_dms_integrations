# Copyright (c) 2023, LinhFrappe and contributors
# For license information, please see license.txt

import frappe
from frappe import publish_progress
from frappe.model.document import Document


class DMSIntegrationSettings(Document):
    def insert_child_doc(self, doctype, data, idx, parent, parentfield):
        new_doc = frappe.new_doc(doctype)

        for field, value in data.items():
            setattr(new_doc, field, value)

        new_doc.parent = parent
        new_doc.idx = idx + 1
        new_doc.parentfield = parentfield
        new_doc.parenttype = "Webhook"
        new_doc.insert(ignore_permissions=True)

    def insert_header_data(self, doc_name, webhook_data):
        """add webhook headers and data"""
        webhook_headers = [
            {
                "key": "Content-Type",
                "value": "application/x-www-form-urlencoded"
            },
            {
                "key": "Authorization",
                "value": "Basic " + self.authen_key
            }
        ]
        for i in range(len(webhook_headers)):
            self.insert_child_doc('Webhook Header', webhook_headers[i], i,
                                  doc_name, "webhook_headers")

        for i in range(len(webhook_data)):
            self.insert_child_doc('Webhook Data', webhook_data[i], i,
                                  doc_name, "webhook_data")

    def delete_webhook(self, name):
        if name:
            frappe.delete_doc(
                "Webhook", name, ignore_permissions=True, delete_permanently=True)

    def insert_webhook(self, webhook_doctype, webhook_docevent, request_method, webhook_data, path_url, enabled=1, request_structure="Form URL-Encoded"):
        doc_new = frappe.new_doc("Webhook")
        doc_new.webhook_doctype = webhook_doctype  # "Item"
        doc_new.webhook_docevent = webhook_docevent  # "on_update"
        doc_new.enabled = enabled
        request_url = self.url_site_dms + path_url  # "/Frappe/Item/InsertUpdate"
        doc_new.request_url = request_url
        doc_new.request_method = request_method  # "POST"
        doc_new.request_structure = request_structure
        doc_new.enable_security = 0
        doc_new.insert()

        self.insert_header_data(doc_new.name, webhook_data)

        return doc_new.name

    def update_doctype(self, doctype, doc_name, data):
        if frappe.db.exists(doctype, doc_name, cache=True):
            doc = frappe.get_doc(doctype, doc_name)
            for field, value in data.items():
                setattr(doc, field, value)
            doc.save()

    """ config webhook """
    @frappe.whitelist()
    def handle_webhook(self, webhook_data):
        try:
            # progress = 0 / 3 * 100
            # publish_progress(
            #     percent=progress, title="Installing Webhooks..", description="Please wait")

            # webhook Item
            if self.wh_item == 1:
                item_fields = webhook_data.get("item_fields")
                frappe.db.delete("Webhook Header", {
                    "parent": ('in', [self.id_wh_item_cu, self.id_wh_item_d])
                })
                frappe.db.delete("Webhook Data", {
                    "parent": ('in', [self.id_wh_item_cu, self.id_wh_item_d])
                })

                if not frappe.db.exists("Webhook", self.id_wh_item_cu, cache=True):
                    id_wh_item_cu = self.insert_webhook(
                        "Item", "on_update", "POST",
                        item_fields,
                        "/Frappe/Item/InsertUpdate"
                    )
                    self.id_wh_item_cu = id_wh_item_cu
                else:
                    self.update_doctype(
                        "Webhook", self.id_wh_item_cu, {"enabled": 1})
                    self.insert_header_data(self.id_wh_item_cu, item_fields)

                if not frappe.db.exists("Webhook", self.id_wh_item_d, cache=True):
                    id_wh_item_d = self.insert_webhook(
                        "Item", "on_trash", "POST",
                        item_fields,
                        "/Frappe/Item/Delete"
                    )
                    self.id_wh_item_d = id_wh_item_d
                else:
                    self.update_doctype(
                        "Webhook", self.id_wh_item_d, {"enabled": 1})
                    self.insert_header_data(self.id_wh_item_d, item_fields)

            else:
                self.update_doctype(
                    "Webhook", self.id_wh_item_cu, {"enabled": 0})
                self.update_doctype(
                    "Webhook", self.id_wh_item_d, {"enabled": 0})

            progress = 1 / 3 * 100
            publish_progress(
                percent=progress, title="Installing Webhooks..", description="Please wait")

            # webhook Customer
            if self.wh_customer == 1:
                customer_fields = webhook_data.get("customer_fields")
                frappe.db.delete("Webhook Header", {
                    "parent": ('in', [self.id_wh_customer_cu, self.id_wh_customer_d])
                })
                frappe.db.delete("Webhook Data", {
                    "parent": ('in', [self.id_wh_customer_cu, self.id_wh_customer_d])
                })

                if not frappe.db.exists("Webhook", self.id_wh_customer_cu, cache=True):
                    id_wh_customer_cu = self.insert_webhook(
                        "Customer", "on_update", "POST",
                        customer_fields,
                        "/Frappe/Customer/InsertUpdate"
                    )
                    self.id_wh_customer_cu = id_wh_customer_cu
                else:
                    self.update_doctype(
                        "Webhook", self.id_wh_customer_cu, {"enabled": 1})
                    self.insert_header_data(
                        self.id_wh_customer_cu, customer_fields)

                if not frappe.db.exists("Webhook", self.id_wh_customer_d, cache=True):
                    id_wh_customer_d = self.insert_webhook(
                        "Customer", "on_trash", "POST",
                        customer_fields,
                        "/Frappe/Customer/Delete"
                    )
                    self.id_wh_customer_d = id_wh_customer_d
                else:
                    self.update_doctype(
                        "Webhook", self.id_wh_customer_d, {"enabled": 1})
                    self.insert_header_data(
                        self.id_wh_customer_d, customer_fields)

            else:
                self.update_doctype(
                    "Webhook", self.id_wh_customer_cu, {"enabled": 0})
                self.update_doctype(
                    "Webhook", self.id_wh_customer_d, {"enabled": 0})

            progress = 2 / 3 * 100
            publish_progress(
                percent=progress, title="Installing Webhooks..", description="Please wait")

            # webhook Order
            if self.wh_order == 1:
                order_fields = webhook_data.get("order_fields")
                frappe.db.delete("Webhook Header", {
                    "parent": ('in', [self.id_wh_order_cu, self.id_wh_order_d])
                })
                frappe.db.delete("Webhook Data", {
                    "parent": ('in', [self.id_wh_order_cu, self.id_wh_order_d])
                })

                if not frappe.db.exists("Webhook", self.id_wh_order_cu, cache=True):
                    id_wh_order_cu = self.insert_webhook(
                        "Sales Order", "on_update", "POST",
                        order_fields,
                        "/Frappe/Order/InsertUpdate"
                    )
                    self.id_wh_order_cu = id_wh_order_cu
                else:
                    self.update_doctype(
                        "Webhook", self.id_wh_order_cu, {"enabled": 1})
                    self.insert_header_data(
                        self.id_wh_order_cu, order_fields)

                if not frappe.db.exists("Webhook", self.id_wh_order_d, cache=True):
                    id_wh_order_d = self.insert_webhook(
                        "Sales Order", "on_trash", "POST",
                        order_fields,
                        "/Frappe/Order/Delete"
                    )
                    self.id_wh_order_d = id_wh_order_d
                else:
                    self.update_doctype(
                        "Webhook", self.id_wh_order_d, {"enabled": 1})
                    self.insert_header_data(
                        self.id_wh_order_d, order_fields)

            else:
                print("=========", '0000000000000')

                self.update_doctype(
                    "Webhook", self.id_wh_order_cu, {"enabled": 0})
                self.update_doctype(
                    "Webhook", self.id_wh_order_d, {"enabled": 0})

            progress = 3 / 3 * 100
            publish_progress(
                percent=progress, title="Installing Webhooks..", description="Please wait")

            return True
        except Exception as err:
            print("=========", err)
            return False

    def on_update(self):
        if self.check_doc == 1:
            frappe.throw(
                title='Error',
                msg='Installing webhooks failed.'
            )
        else:
            frappe.msgprint(
                title="Notification",
                msg="Webhooks installed successfully!",
            )

    def on_trash(self):
        self.delete_webhook(self.id_wh_order_d)
        self.delete_webhook(self.id_wh_order_cu)
        self.delete_webhook(self.id_wh_customer_d)
        self.delete_webhook(self.id_wh_customer_cu)
        self.delete_webhook(self.id_wh_item_d)
        self.delete_webhook(self.id_wh_item_cu)
