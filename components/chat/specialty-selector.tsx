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

interface SpecialtySelectorProps {
    className?: string;
    hidden?: boolean;
}

export function SpecialtySelector({ className, hidden }: SpecialtySelectorProps) {
    const { activeSpecialty, setSpecialty } = useSpecialty();
    const specialties = getAllSpecialties();
    const currentSpecialty = activeSpecialty ? getSpecialtyById(activeSpecialty) : null;

    const handleSelect = (specialtyId: string | null) => {
        setSpecialty(specialtyId);
    };

    if (hidden) return null;

    const IconComponent = currentSpecialty?.icon;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 gap-2 px-3 rounded-full bg-background/80 backdrop-blur-sm border shadow-sm hover:shadow-md transition-shadow ${className || ""}`}
                >
                    <span className="flex items-center gap-1.5 text-sm">
                        {IconComponent ? (
                            <>
                                <IconComponent className="h-4 w-4" />
                                {currentSpecialty.name}
                            </>
                        ) : (
                            <>
                                Spécialité
                            </>
                        )}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
                {specialties.map((specialty) => {
                    const isSelected = activeSpecialty === specialty.id;
                    const Icon = specialty.icon;

                    return (
                        <DropdownMenuItem
                            key={specialty.id}
                            className="flex items-start gap-3 cursor-pointer py-3"
                            onClick={() => handleSelect(specialty.id)}
                        >
                            <Icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-medium text-sm">{specialty.name}</span>
                                    {isSelected && (
                                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {specialty.description}
                                </p>
                            </div>
                        </DropdownMenuItem>
                    );
                })}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => handleSelect(null)}
                >
                    <span className="text-sm text-muted-foreground">Aucune spécialité</span>
                    {!activeSpecialty && (
                        <Check className="h-4 w-4 text-muted-foreground" />
                    )}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
