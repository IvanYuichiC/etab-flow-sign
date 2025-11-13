import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { FileText, Eye, QrCode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface DocumentCardProps {
  document: {
    id: string;
    document_id: string;
    title: string;
    description?: string;
    document_type: string;
    department: string;
    status: "Pending" | "In Progress" | "Completed" | "Returned";
    created_at: string;
  };
}

export const DocumentCard = ({ document }: DocumentCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-primary" />
              <span className="text-sm font-mono text-muted-foreground">{document.document_id}</span>
            </div>
            <CardTitle className="text-lg">{document.title}</CardTitle>
            <CardDescription className="mt-1">
              {document.description || "No description provided"}
            </CardDescription>
          </div>
          <StatusBadge status={document.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <div className="space-y-1">
            <div>
              <span className="font-medium">Type:</span> {document.document_type}
            </div>
            <div>
              <span className="font-medium">Department:</span> {document.department}
            </div>
            <div>
              <span className="font-medium">Created:</span>{" "}
              {format(new Date(document.created_at), "MMM dd, yyyy")}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => navigate(`/document/${document.id}`)}
            variant="default"
            size="sm"
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
          <Button
            onClick={() => navigate(`/track/${document.id}`)}
            variant="outline"
            size="sm"
          >
            <QrCode className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
