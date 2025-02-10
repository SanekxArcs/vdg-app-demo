"use client";

import { useState } from "react";
import useSWR from "swr";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  PieChart,
  TrendingUp,
  Receipt,
  Edit,
  Trash,
} from "lucide-react";
import { client } from "@/sanity/client";

// Import our dialog components
import { EditTransactionDialog } from "@/components/firmCost/EditTransactionDialog";
import ConfirmDeleteDialog from "@/components/firmCost/ConfirmDeleteDialog";
import { toast } from "sonner";

// ─── TYPES ────────────────────────────────────────────────────────────────

// Define the Transaction interface (updated)
export interface Transaction {
  _id: string;
  description: string;
  amount: number;
  type: "expense" | "revenue";
  category: string;
  partner:
    | string
    | { _id: string; name?: string; share?: number }
    | { type: "reference"; _ref: string }
    | null;
  date: string;
}

// Define the Partner interface
export interface Partner {
  _id: string;
  name: string;
  share: number;
}

// ─── SWR FETCHER ─────────────────────────────────────────────────────────────

const fetcher = (query: string) => client.fetch(query);
const TAX_RATE = 0.23; // 23% tax rate

// ─── COMPONENT ─────────────────────────────────────────────────────────────

export default function FirmCostsPage() {
  // Form state for adding new transactions
  const [description, setDescription] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [type, setType] = useState<"expense" | "revenue">("expense");
  const [category, setCategory] = useState<string>("");
  const [partner, setPartner] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // State for dialogs and selected transaction
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);

  // Fetch transactions and partners from Sanity
  const { data: transactions = [], mutate: mutateTransactions } = useSWR<
    Transaction[]
  >('*[_type == "transaction"]{..., partner->}', fetcher);
  const { data: partners = [] } = useSWR<Partner[]>(
    '*[_type == "partner"]',
    fetcher
  );

  // ─── CALCULATIONS ────────────────────────────────────────────────────────

  // Calculate totals based on transactions
  const calculateTotals = () => {
    const revenue = transactions
      .filter((t) => t.type === "revenue")
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    const grossProfit = revenue - expenses;
    const tax = grossProfit * TAX_RATE;
    const netProfit = grossProfit - tax;
    return { revenue, expenses, grossProfit, tax, netProfit };
  };

  // Calculate a given partner's share from net profit
  const calculatePartnerShare = (partnerId: string) => {
    const { netProfit } = calculateTotals();
    const partnerData = partners.find((p) => p._id === partnerId);
    return partnerData ? netProfit * partnerData.share : 0;
  };

  // ─── HANDLERS ─────────────────────────────────────────────────────────────

  // Handle form submission to add a new transaction
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedDate) {
      toast.error("Please select a date");
      console.error("Please select a date");
      return;
    }
    const newTransaction = {
      _type: "transaction",
      description,
      amount: parseFloat(amount),
      type,
      category,
      partner: { _type: "reference", _ref: partner },
      date: selectedDate.toISOString(),
    };

    try {
      await client.create(newTransaction);
      mutateTransactions();
      // Reset form fields
      setDescription("");
      setAmount("");
      setType("expense");
      setCategory("");
      setPartner("");
      setSelectedDate(null);
    } catch (error) {
      console.error("Error adding transaction:", error);
    }
  };

  // Handler to update an existing transaction
  const handleUpdateTransaction = async (
    updatedTransaction: Transaction
  ): Promise<void> => {
    try {
      await client
        .patch(updatedTransaction._id)
        .set({
          description: updatedTransaction.description,
          amount: updatedTransaction.amount,
          type: updatedTransaction.type,
          category: updatedTransaction.category,
          partner: updatedTransaction.partner,
          date: updatedTransaction.date,
        })
        .commit();
      mutateTransactions();
      setShowEditDialog(false);
      setSelectedTransaction(null);
    } catch (error) {
      console.error("Error updating transaction:", error);
    }
  };

  // Handler to delete a transaction
  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      await client.delete(transactionId);
      mutateTransactions();
      setShowDeleteDialog(false);
      setSelectedTransaction(null);
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const totals = calculateTotals();

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="flex-1 space-y-4 p-1 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Firm Costs</h2>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totals.revenue.toLocaleString()} zl
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Expenses
              </CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totals.expenses.toLocaleString()} zl
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Gross Profit
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totals.grossProfit.toLocaleString()} zl
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totals.netProfit.toLocaleString()} zl
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="partners">Partner Shares</TabsTrigger>
          </TabsList>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Add New Transaction</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Description Field */}
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter description"
                      />
                    </div>
                    {/* Amount Field */}
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                      />
                    </div>
                    {/* Type Field */}
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={type}
                        onValueChange={(value: "expense" | "revenue") =>
                          setType(value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="expense">Expense</SelectItem>
                          <SelectItem value="revenue">Revenue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Category Field */}
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="supplies">Supplies</SelectItem>
                          <SelectItem value="project">Project</SelectItem>
                          <SelectItem value="salary">Salary</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Partner Field */}
                    <div className="space-y-2">
                      <Label>Partner</Label>
                      <Select value={partner} onValueChange={setPartner}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select partner" />
                        </SelectTrigger>
                        <SelectContent>
                          {partners.map((p: Partner) => (
                            <SelectItem key={p._id} value={p._id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Date Field */}
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        name="date"
                        type="date"
                        value={
                          selectedDate
                            ? selectedDate.toISOString().split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          setSelectedDate(new Date(e.target.value))
                        }
                      />
                    </div>
                  </div>
                  <Button type="submit">Add Transaction</Button>
                </form>

                {/* Transaction History Table */}
                <div className="mt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Partner</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell className="text-right">Actions</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.length > 0 ? (
                        transactions.map((transaction: Transaction) => (
                          <TableRow key={transaction._id}>
                            <TableCell>
                              {new Date(transaction.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="truncate">
                              {transaction.description}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`capitalize ${
                                  transaction.type === "revenue"
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {transaction.type}
                              </span>
                            </TableCell>
                            <TableCell className="capitalize">
                              {transaction.category}
                            </TableCell>
                            <TableCell>
                              {typeof transaction.partner === "object"
                                ? (transaction.partner as any).name || "N/A"
                                : transaction.partner || "N/A"}
                            </TableCell>
                            <TableCell className="text-nowrap">
                              {transaction.amount.toLocaleString()} zl
                            </TableCell>
                            <TableCell className="space-x-2 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedTransaction(transaction);
                                  setShowEditDialog(true);
                                }}
                              >
                                <Edit />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedTransaction(transaction);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center">
                            No transactions found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Partner Shares Tab */}
          <TabsContent value="partners">
            <Card>
              <CardHeader>
                <CardTitle>Partner Profit Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Tax Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <dl className="space-y-2">
                          <div className="flex justify-between">
                            <dt>Tax Rate:</dt>
                            <dd>{(TAX_RATE * 100).toFixed(0)}%</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt>Total Tax Amount:</dt>
                            <dd>{totals.tax.toLocaleString()} zl</dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Profit Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <dl className="space-y-2">
                          <div className="flex justify-between">
                            <dt>Gross Profit:</dt>
                            <dd>{totals.grossProfit.toLocaleString()} zl</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt>Net Profit:</dt>
                            <dd>{totals.netProfit.toLocaleString()} zl</dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableCell>Partner</TableCell>
                        <TableCell>Share Percentage</TableCell>
                        <TableCell>Amount</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partners.map((p: Partner) => (
                        <TableRow key={p._id}>
                          <TableCell>{p.name}</TableCell>
                          <TableCell>{(p.share * 100).toFixed(0)}%</TableCell>
                          <TableCell>
                            {calculatePartnerShare(p._id).toLocaleString()} zl
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Transaction Dialog */}
      {showEditDialog && selectedTransaction && (
        <EditTransactionDialog
          isOpen={showEditDialog}
          transaction={selectedTransaction}
          onClose={() => {
            setShowEditDialog(false);
            setSelectedTransaction(null);
          }}
          onSave={handleUpdateTransaction}
          partners={partners}
        />
      )}

      {/* Confirm Delete Dialog */}
      {showDeleteDialog && selectedTransaction && (
        <ConfirmDeleteDialog
          isOpen={showDeleteDialog}
          transaction={selectedTransaction}
          onClose={() => {
            setShowDeleteDialog(false);
            setSelectedTransaction(null);
          }}
          onConfirm={handleDeleteTransaction}
        />
      )}
    </Layout>
  );
}
