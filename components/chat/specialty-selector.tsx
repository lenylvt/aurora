"use client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Check } from "lucide-react";
import { useSpecialty } from "./specialty-provider";
import { getAllSpecialties, getSpecialtyById } from "@/lib/specialties/config";
import * as LucideIcons from "lucide-react";

interface SpecialtySelectorProps {
    className?: string;
    hasStartedChat?: boolean;
}

export function SpecialtySelector({ className, hasStartedChat = false }: SpecialtySelectorProps) {
    const { activeSpecialty, setSpecialty } = useSpecialty();
    const specialties = getAllSpecialties();
    const currentSpecialty = activeSpecialty ? getSpecialtyById(activeSpecialty) : null;

    // Hide if chat has started without a specialty
    if (hasStartedChat && !activeSpecialty) {
        return null;
    }

    const handleSelect = (specialtyId: string | null) => {
        setSpecialty(specialtyId);
    };

    // Get current icon component
    const CurrentIcon = currentSpecialty
        ? ((LucideIcons as any)[currentSpecialty.icon] || LucideIcons.Globe)
        : null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 gap-1.5 px-2 text-muted-foreground hover:text-foreground ${className || ""}`}
                >
                    {CurrentIcon && <CurrentIcon className="h-4 w-4" />}
                    <span className="text-sm">
                        {currentSpecialty ? currentSpecialty.name : "Spécialité"}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
                {specialties.map((specialty) => {
                    const isSelected = activeSpecialty === specialty.id;
                    const IconComponent = (LucideIcons as any)[specialty.icon] || LucideIcons.Globe;

                    return (
                        <DropdownMenuItem
                            key={specialty.id}
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => handleSelect(specialty.id)}
                        >
                            <IconComponent className="h-4 w-4" />
                            <span className="flex-1">{specialty.name}</span>
                            {isSelected && <Check className="h-4 w-4" />}
                        </DropdownMenuItem>
                    );
                })}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => handleSelect(null)}
                >
                    <span className="flex-1 text-muted-foreground">Aucune spécialité</span>
                    {!activeSpecialty && <Check className="h-4 w-4 text-muted-foreground" />}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
